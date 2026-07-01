import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants as zlibConstants, gzipSync } from "node:zlib";

const cesiumDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(cesiumDir, "..");
const sourceDataDir = path.join(rootDir, "site", "data3d");
const sourcePublicDir = path.join(rootDir, "site", "public");
const outDir = path.join(cesiumDir, "data");
const outPublicDir = path.join(cesiumDir, "public");
const vendorCesiumDir = path.join(cesiumDir, "vendor", "cesium");
const nodeCesiumBuildDir = path.join(cesiumDir, "node_modules", "cesium", "Build", "Cesium");

const TERRAIN_VERTICAL_EXAGGERATION = 1.35;
const MESH_HEADER_BYTES = 32;
const PACKED_VERTEX_BYTES = 8;
const WGS84_A = 6378137.0;
const WGS84_E2 = 6.69437999014e-3;
const TREE_DENSITY_M2 = 180;
const TREE_MIN_POLYGON_AREA_M2 = 650;
const TREE_MAX_PER_POLYGON = 1300;
const TREE_MAX_PER_CITY = 28000;
const TREE_TILE_COUNT = 16;
const TREE_TILESET_GEOMETRIC_ERROR = 130;
const TREE_TILE_GEOMETRIC_ERROR = 18;
const TREE_BUILDING_EXCLUSION_CELL = 8;
const TREE_BUILDING_EXCLUSION_RADIUS = 12;
const BUILDING_DESKTOP_GEOMETRIC_ERROR = 95;
const BUILDING_MOBILE_GEOMETRIC_ERROR = 72;
const BUILDING_STABLE_SINGLE_TILE = true;
const BUILDING_QUANTIZE_POSITIONS = false;
const BROTLI_QUALITY = 7;

const manifest = JSON.parse(readFileSync(path.join(sourceDataDir, "manifest.json"), "utf8"));

function assertGeneratedPath(target) {
  const resolved = path.resolve(target);
  if (path.dirname(resolved) !== cesiumDir || !["data", "public"].includes(path.basename(resolved))) {
    throw new Error(`Refusing to clean unexpected path: ${resolved}`);
  }
}

function cleanGenerated() {
  for (const target of [outDir, outPublicDir]) {
    assertGeneratedPath(target);
    rmSync(target, { recursive: true, force: true });
    mkdirSync(target, { recursive: true });
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value, pretty = false) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, pretty ? 2 : 0));
}

function writeBinaryAsset(filePath, buffer, compress = false) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, buffer);
  if (!compress) return { byteLength: buffer.length, gzipBytes: 0, brotliBytes: 0 };
  const gz = gzipSync(buffer, { level: 9 });
  const br = brotliCompressSync(buffer, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY
    }
  });
  writeFileSync(`${filePath}.gz`, gz);
  writeFileSync(`${filePath}.br`, br);
  return { byteLength: buffer.length, gzipBytes: gz.length, brotliBytes: br.length };
}

function copyPublicAssets() {
  if (!existsSync(sourcePublicDir)) return;
  for (const entry of readdirSync(sourcePublicDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourcePublicDir, entry.name);
    const outPath = path.join(outPublicDir, entry.name);
    if (entry.isDirectory()) {
      cpSync(sourcePath, outPath, { recursive: true });
    } else if (entry.isFile()) {
      copyFileSync(sourcePath, outPath);
    }
  }
}

function copyCesiumVendor() {
  if (!existsSync(nodeCesiumBuildDir)) {
    console.warn("Cesium package is not installed. Run: npm --prefix site_cesium_v2 install");
    return;
  }
  const resolved = path.resolve(vendorCesiumDir);
  if (path.dirname(resolved) !== path.join(cesiumDir, "vendor") || path.basename(resolved) !== "cesium") {
    throw new Error(`Refusing to clean unexpected vendor path: ${resolved}`);
  }
  rmSync(vendorCesiumDir, { recursive: true, force: true });
  mkdirSync(path.dirname(vendorCesiumDir), { recursive: true });
  cpSync(nodeCesiumBuildDir, vendorCesiumDir, { recursive: true });
}

function metersPerDegree(lat) {
  const rad = lat * Math.PI / 180;
  return {
    lon: Math.cos(rad) * 111320,
    lat: 111320
  };
}

function localToLonLat(city, point) {
  const [centerLon, centerLat] = city.center;
  const meters = metersPerDegree(centerLat);
  return [
    centerLon + point[0] / meters.lon,
    centerLat + point[1] / meters.lat
  ];
}

function sampleTerrain(terrain, x, y) {
  if (!terrain?.h?.length) return 0;
  const [minX, minY, maxX, maxY] = terrain.bbox;
  if (x < minX || x > maxX || y < minY || y > maxY) return 0;
  const col = ((x - minX) / (maxX - minX || 1)) * (terrain.width - 1);
  const row = ((maxY - y) / (maxY - minY || 1)) * (terrain.height - 1);
  const x0 = Math.max(0, Math.min(terrain.width - 1, Math.floor(col)));
  const y0 = Math.max(0, Math.min(terrain.height - 1, Math.floor(row)));
  const x1 = Math.min(terrain.width - 1, x0 + 1);
  const y1 = Math.min(terrain.height - 1, y0 + 1);
  const tx = col - x0;
  const ty = row - y0;
  const scale = terrain.scale || 1;
  const valueAt = (cx, cy) => ((terrain.h[cy * terrain.width + cx] || 0) / scale) * TERRAIN_VERTICAL_EXAGGERATION;
  const top = valueAt(x0, y0) * (1 - tx) + valueAt(x1, y0) * tx;
  const bottom = valueAt(x0, y1) * (1 - tx) + valueAt(x1, y1) * tx;
  return top * (1 - ty) + bottom * ty;
}

function localPointToDegrees(city, terrain, point, offset = 1.5) {
  const [lon, lat] = localToLonLat(city, point);
  return [round(lon, 7), round(lat, 7), round(sampleTerrain(terrain, point[0], point[1]) + offset, 2)];
}

function convertPolygonFeature(city, terrain, feature, offset = 2) {
  return {
    id: feature.id,
    bbox: feature.bbox,
    polygons: (feature.polygons || []).map((polygon) =>
      polygon.map((ring) => ring.map((point) => localPointToDegrees(city, terrain, point, offset)))
    ),
    properties: feature.properties || {}
  };
}

function convertLineCollection(city, terrain, payload, offset = 2.2) {
  return {
    lines: (payload?.lines || []).map((line) => line.map((point) => localPointToDegrees(city, terrain, point, offset)))
  };
}

function convertPointCollection(city, terrain, payload, offset = 4) {
  return {
    items: (payload?.items || []).map((item) => ({
      point: localPointToDegrees(city, terrain, item.point, offset),
      properties: item.properties || {}
    }))
  };
}

function convertLabels(city, terrain, payload, offset = 3) {
  return {
    labels: (payload?.labels || []).map((item) => ({
      ...item,
      point: localPointToDegrees(city, terrain, item.point, offset),
      line: (item.line || []).map((point) => localPointToDegrees(city, terrain, point, offset))
    }))
  };
}

function round(value, digits) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function buildCityLayers(city, cityOutDir) {
  const citySource = path.join(sourceDataDir, city.slug);
  const terrain = existsSync(path.join(citySource, "terrain.json"))
    ? readJson(path.join(citySource, "terrain.json"))
    : null;
  const quartals = featureList(readJson(path.join(citySource, "quartals.json")));
  const green = readJson(path.join(citySource, "green.json"));
  const water = readJson(path.join(citySource, "water.json"));
  const roads = readJson(path.join(citySource, "roads.json"));
  const roadsMediumPath = path.join(citySource, "roads-medium.json");
  const roadsMedium = existsSync(roadsMediumPath) ? readJson(roadsMediumPath) : { lines: [] };
  const roadsAll = readRoadAllSegments(citySource);
  const railways = readJson(path.join(citySource, "railways.json"));
  const stops = readJson(path.join(citySource, "stops.json"));
  const dtp = readJson(path.join(citySource, "dtp.json"));
  const roadLabelsPath = path.join(citySource, "road-labels.json");
  const roadLabels = existsSync(roadLabelsPath) ? readJson(roadLabelsPath) : { labels: [] };

  const meta = {
    slug: city.slug,
    name: city.name,
    center: localPointToDegrees(city, terrain, [0, 0], 90),
    projectedBbox: city.projectedBbox,
    stats: city.stats,
    rank: city.rank,
    index: city.index,
    population: city.population,
    lowShare: city.lowShare,
    midShare: city.midShare,
    highShare: city.highShare
  };
  writeJson(path.join(cityOutDir, "meta.json"), meta);
  writeJson(path.join(cityOutDir, "quartals.json"), {
    quartals: quartals.map((feature) => convertPolygonFeature(city, terrain, feature, 2.8))
  });
  writeJson(path.join(cityOutDir, "surfaces.json"), {
    green: (green.features || []).map((feature) => convertPolygonFeature(city, terrain, feature, 1.2)),
    greenVisible: (green.visibleFeatures || green.features || []).map((feature) => convertPolygonFeature(city, terrain, feature, 1.2)),
    water: (water.features || []).map((feature) => convertPolygonFeature(city, terrain, feature, 1.0))
  });
  writeJson(path.join(cityOutDir, "roads.json"), {
    roads: convertLineCollection(city, terrain, roads, 3.2),
    roadsMedium: convertLineCollection(city, terrain, roadsMedium, 3.18),
    railways: convertLineCollection(city, terrain, railways, 3.4)
  });
  writeJson(path.join(cityOutDir, "roads-detail.json"), {
    roadsAll: convertLineCollection(city, terrain, { lines: roadsAll }, 3.15)
  });
  writeJson(path.join(cityOutDir, "points.json"), {
    stops: convertPointCollection(city, terrain, stops, 6),
    dtp: convertPointCollection(city, terrain, dtp, 7)
  });
  writeJson(path.join(cityOutDir, "road-labels.json"), {
    roadLabels: convertLabels(city, terrain, roadLabels, 5)
  });
  const treeStats = buildTreeTiles(city, terrain, green.features || [], cityOutDir);
  return { terrain, treeStats };
}

function featureList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.features)) return payload.features;
  return [];
}

function buildTreeTiles(city, terrain, greenFeatures, cityOutDir) {
  const buildingExclusion = buildBuildingExclusionGrid(city);
  const specs = [];
  for (let featureIndex = 0; featureIndex < greenFeatures.length; featureIndex += 1) {
    const feature = greenFeatures[featureIndex];
    for (let polygonIndex = 0; polygonIndex < (feature.polygons || []).length; polygonIndex += 1) {
      const polygon = feature.polygons[polygonIndex];
      const rings = (polygon || []).map(openRing).filter((ring) => ring.length >= 3);
      if (!rings.length) continue;
      const area = Math.max(0, Math.abs(localRingArea(rings[0])) - rings.slice(1).reduce((sum, ring) => sum + Math.abs(localRingArea(ring)), 0));
      if (area < TREE_MIN_POLYGON_AREA_M2) continue;
      const count = Math.min(TREE_MAX_PER_POLYGON, Math.max(1, Math.round(area / TREE_DENSITY_M2)));
      specs.push({ featureIndex, polygonIndex, rings, bbox: localRingBbox(rings[0]), area, count });
    }
  }
  const total = specs.reduce((sum, spec) => sum + spec.count, 0);
  const scale = total > TREE_MAX_PER_CITY ? TREE_MAX_PER_CITY / total : 1;
  const treeDir = path.join(cityOutDir, "trees");
  const treeTilesDir = path.join(cityOutDir, "trees-3d", "tiles");
  const itemsByTile = new Map();
  const instancesByTile = new Map();
  let itemCount = 0;
  for (const spec of specs) {
    if (itemCount >= TREE_MAX_PER_CITY) break;
    const targetCount = Math.min(
      TREE_MAX_PER_CITY - itemCount,
      Math.max(1, Math.floor(spec.count * scale))
    );
    const rng = mulberry32(hashString(`${city.slug}:${spec.featureIndex}:${spec.polygonIndex}:${Math.round(spec.area)}`));
    let placed = 0;
    let attempts = 0;
    while (placed < targetCount && attempts < targetCount * 80) {
      attempts += 1;
      const x = spec.bbox[0] + rng() * (spec.bbox[2] - spec.bbox[0]);
      const y = spec.bbox[1] + rng() * (spec.bbox[3] - spec.bbox[1]);
      if (!pointInLocalPolygon([x, y], spec.rings)) continue;
      if (isNearBuildingExclusion(buildingExclusion, x, y)) continue;
      const height = 4.8 + rng() * 5.4 + Math.min(2.1, Math.sqrt(spec.area) / 360);
      const key = treeTileKey(city, x, y);
      if (!itemsByTile.has(key)) itemsByTile.set(key, []);
      if (!instancesByTile.has(key)) instancesByTile.set(key, { leaf: [], conifer: [] });
      const terrainZ = sampleTerrain(terrain, x, y) + 0.22;
      const kind = Math.floor(rng() * 4);
      const model = kind === 3 ? "conifer" : "leaf";
      const treeScale = round(Math.max(0.62, Math.min(1.42, height / 7.1)), 3);
      itemsByTile.get(key).push({
        point: localPointToDegrees(city, terrain, [x, y], 0.25),
        height: round(height, 1),
        crown: round(1.35 + rng() * 1.45 + Math.min(0.8, height / 15), 1),
        trunk: round(0.1 + rng() * 0.08 + height * 0.008, 2),
        kind
      });
      instancesByTile.get(key)[model].push({
        position: [x, y, terrainZ],
        scale: treeScale
      });
      itemCount += 1;
      placed += 1;
    }
  }
  const treeGlbs = {
    leaf: createTreeGlb("leaf"),
    conifer: createTreeGlb("conifer")
  };
  const treeChildren = [];
  const treeBounds = [];
  let treeByteLength = 0;
  let treeGzipBytes = 0;
  let treeBrotliBytes = 0;
  const tiles = [...itemsByTile.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([key, items]) => {
      writeJson(path.join(treeDir, `${key}.json`), { items });
      const groupedInstances = instancesByTile.get(key) || {};
      for (const model of ["leaf", "conifer"]) {
        const instances = groupedInstances[model] || [];
        if (!instances.length) continue;
        const bounds = boundsFromTreeInstances(instances, model);
        const fileName = `${key}-${model}.i3dm`;
        const i3dm = createI3dm(treeGlbs[model], instances);
        const stats = writeBinaryAsset(path.join(treeTilesDir, fileName), i3dm, true);
        treeByteLength += stats.byteLength;
        treeGzipBytes += stats.gzipBytes;
        treeBrotliBytes += stats.brotliBytes;
        treeBounds.push(bounds);
        treeChildren.push({
          boundingVolume: { box: boxFromBounds(bounds) },
          geometricError: TREE_TILE_GEOMETRIC_ERROR,
          refine: "ADD",
          content: { uri: `tiles/${fileName}` }
        });
      }
      return {
        key,
        url: `data/${city.slug}/trees/${key}.json`,
        bbox: treeTileBbox(city, key),
        count: items.length
      };
    });
  writeJson(path.join(treeDir, "manifest.json"), {
    tileCount: TREE_TILE_COUNT,
    total: itemCount,
    tiles
  });
  if (treeChildren.length) {
    writeTileset(
      path.join(cityOutDir, "trees-3d", "tileset.json"),
      city,
      treeChildren,
      mergeBounds(treeBounds),
      TREE_TILESET_GEOMETRIC_ERROR,
      { refine: "ADD" }
    );
  }
  return {
    total: itemCount,
    tiles: tiles.length,
    instancedTiles: treeChildren.length,
    byteLength: treeByteLength,
    gzipBytes: treeGzipBytes,
    brotliBytes: treeBrotliBytes
  };
}

function buildBuildingExclusionGrid(city) {
  const sourceBase = path.join(sourceDataDir, city.slug, "buildings");
  const cells = new Set();
  if (!existsSync(sourceBase)) return { cells, cellSize: TREE_BUILDING_EXCLUSION_CELL };
  const files = readdirSync(sourceBase)
    .filter((name) => name.endsWith("-standard.bin"))
    .sort();
  const cellSize = TREE_BUILDING_EXCLUSION_CELL;
  const radiusCells = Math.ceil(TREE_BUILDING_EXCLUSION_RADIUS / cellSize);
  for (const file of files) {
    const mesh = unpackBuildingMesh(readFileSync(path.join(sourceBase, file)));
    if (!mesh?.positions?.length) continue;
    for (let i = 0; i < mesh.vertexCount; i += 1) {
      const x = mesh.positions[i * 3];
      const y = mesh.positions[i * 3 + 1];
      const cx = Math.floor(x / cellSize);
      const cy = Math.floor(y / cellSize);
      for (let dx = -radiusCells; dx <= radiusCells; dx += 1) {
        for (let dy = -radiusCells; dy <= radiusCells; dy += 1) {
          cells.add(`${cx + dx}:${cy + dy}`);
        }
      }
    }
  }
  return { cells, cellSize };
}

function isNearBuildingExclusion(grid, x, y) {
  if (!grid?.cells?.size) return false;
  const cx = Math.floor(x / grid.cellSize);
  const cy = Math.floor(y / grid.cellSize);
  return grid.cells.has(`${cx}:${cy}`);
}

function treeTileKey(city, x, y) {
  const [minX, minY, maxX, maxY] = city.projectedBbox;
  const col = Math.max(0, Math.min(TREE_TILE_COUNT - 1, Math.floor(((x - minX) / (maxX - minX || 1)) * TREE_TILE_COUNT)));
  const row = Math.max(0, Math.min(TREE_TILE_COUNT - 1, Math.floor(((y - minY) / (maxY - minY || 1)) * TREE_TILE_COUNT)));
  return `${col}-${row}`;
}

function treeTileBbox(city, key) {
  const [col, row] = key.split("-").map((value) => Number(value));
  const [minX, minY, maxX, maxY] = city.projectedBbox;
  const stepX = (maxX - minX) / TREE_TILE_COUNT;
  const stepY = (maxY - minY) / TREE_TILE_COUNT;
  const x0 = minX + col * stepX;
  const x1 = col === TREE_TILE_COUNT - 1 ? maxX : x0 + stepX;
  const y0 = minY + row * stepY;
  const y1 = row === TREE_TILE_COUNT - 1 ? maxY : y0 + stepY;
  const a = localToLonLat(city, [x0, y0]);
  const b = localToLonLat(city, [x1, y1]);
  return [
    round(Math.min(a[0], b[0]), 7),
    round(Math.min(a[1], b[1]), 7),
    round(Math.max(a[0], b[0]), 7),
    round(Math.max(a[1], b[1]), 7)
  ];
}

function openRing(ring) {
  if (!Array.isArray(ring) || ring.length < 2) return ring || [];
  const first = ring[0];
  const last = ring.at(-1);
  return first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring;
}

function localRingArea(ring) {
  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function localRingBbox(ring) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of ring) {
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }
  return [minX, minY, maxX, maxY];
}

function pointInLocalPolygon(point, rings) {
  if (!pointInLocalRing(point, rings[0])) return false;
  return !rings.slice(1).some((ring) => pointInLocalRing(point, ring));
}

function pointInLocalRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-9) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function readRoadAllSegments(citySource) {
  const roadDir = path.join(citySource, "roads-all");
  if (!existsSync(roadDir)) return [];
  const result = [];
  for (const file of readdirSync(roadDir).filter((name) => name.endsWith(".json")).sort()) {
    const payload = readJson(path.join(roadDir, file));
    for (const segment of payload.segments || []) {
      if (Array.isArray(segment) && segment.length > 1) result.push(segment);
    }
  }
  return result;
}

function unpackBuildingMesh(buffer) {
  if (!buffer || buffer.length < MESH_HEADER_BYTES) return null;
  const magic = buffer.subarray(0, 4).toString("ascii");
  if (magic !== "LIM4") throw new Error(`Unsupported building mesh magic: ${magic}`);
  const vertexCount = buffer.readUInt32LE(4);
  const stride = buffer.readUInt32LE(28) || PACKED_VERTEX_BYTES;
  if (!vertexCount) return null;

  const origin = [buffer.readFloatLE(8), buffer.readFloatLE(12), buffer.readFloatLE(16)];
  const scale = [buffer.readFloatLE(20), buffer.readFloatLE(24)];
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Uint8Array(vertexCount * 4);
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity
  };

  for (let i = 0; i < vertexCount; i += 1) {
    const offset = MESH_HEADER_BYTES + i * stride;
    const x = origin[0] + buffer.readInt16LE(offset) * scale[0];
    const y = origin[1] + buffer.readInt16LE(offset + 2) * scale[0];
    const z = origin[2] + buffer.readInt16LE(offset + 4) * scale[1];
    const color = styleColor(buffer.readUInt8(offset + 6));
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    colors[i * 4] = color[0];
    colors[i * 4 + 1] = color[1];
    colors[i * 4 + 2] = color[2];
    colors[i * 4 + 3] = 255;
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.minZ = Math.min(bounds.minZ, z);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
    bounds.maxZ = Math.max(bounds.maxZ, z);
  }

  return { positions, colors, vertexCount, bounds };
}

function mergeBuildingMeshes(meshes) {
  const source = (meshes || []).filter(Boolean);
  if (!source.length) return null;
  if (source.length === 1) return source[0];
  const vertexCount = source.reduce((sum, mesh) => sum + mesh.vertexCount, 0);
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Uint8Array(vertexCount * 4);
  let positionOffset = 0;
  let colorOffset = 0;
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity
  };
  for (const mesh of source) {
    positions.set(mesh.positions, positionOffset);
    colors.set(mesh.colors, colorOffset);
    positionOffset += mesh.positions.length;
    colorOffset += mesh.colors.length;
    bounds.minX = Math.min(bounds.minX, mesh.bounds.minX);
    bounds.minY = Math.min(bounds.minY, mesh.bounds.minY);
    bounds.minZ = Math.min(bounds.minZ, mesh.bounds.minZ);
    bounds.maxX = Math.max(bounds.maxX, mesh.bounds.maxX);
    bounds.maxY = Math.max(bounds.maxY, mesh.bounds.maxY);
    bounds.maxZ = Math.max(bounds.maxZ, mesh.bounds.maxZ);
  }
  return { positions, colors, vertexCount, bounds };
}

function styleColor(style) {
  const kind = Math.floor((style + 0.5) / 16);
  const shadeLevel = (style + 0.5) % 16;
  const shade = 0.86 + shadeLevel * 0.012;
  let base = [0.78, 0.78, 0.74];
  if (kind > 0.5 && kind < 1.5) base = [0.75, 0.75, 0.71];
  else if (kind > 1.5 && kind < 2.5) base = [0.69, 0.69, 0.65];
  else if (kind > 2.5 && kind < 3.5) base = [0.68, 0.68, 0.65];
  else if (kind > 3.5 && kind < 4.5) base = [0.65, 0.65, 0.62];
  else if (kind > 4.5) base = [0.6, 0.6, 0.57];
  return base.map((channel) => {
    const srgb = Math.max(0, Math.min(1, channel * shade));
    const linear = srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    return Math.max(0, Math.min(255, Math.round(linear * 255)));
  });
}

function buildTerrainMesh(terrain) {
  if (!terrain?.h?.length) return null;
  const positions = [];
  const colors = [];
  const [minX, minY, maxX, maxY] = terrain.bbox;
  const width = terrain.width;
  const height = terrain.height;
  const scale = terrain.scale || 1;

  function vertex(col, row) {
    const x = minX + (col / (width - 1 || 1)) * (maxX - minX);
    const y = maxY - (row / (height - 1 || 1)) * (maxY - minY);
    const z = ((terrain.h[row * width + col] || 0) / scale) * TERRAIN_VERTICAL_EXAGGERATION;
    const t = Math.max(0, Math.min(1, z / 130));
    const color = [
      Math.round(194 - t * 34),
      Math.round(204 - t * 24),
      Math.round(178 - t * 34),
      255
    ];
    positions.push(x, y, z);
    colors.push(...color);
  }

  for (let row = 0; row < height - 1; row += 1) {
    for (let col = 0; col < width - 1; col += 1) {
      vertex(col, row);
      vertex(col + 1, row);
      vertex(col, row + 1);
      vertex(col + 1, row);
      vertex(col + 1, row + 1);
      vertex(col, row + 1);
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Uint8Array(colors),
    vertexCount: positions.length / 3,
    bounds: {
      minX,
      minY,
      minZ: 0,
      maxX,
      maxY,
      maxZ: Math.max(...terrain.h) / scale * TERRAIN_VERTICAL_EXAGGERATION
    }
  };
}

function align8Length(length) {
  return Math.ceil(length / 8) * 8;
}

function paddedBuffer(buffer, padByte = 0x20) {
  const padded = Buffer.alloc(align8Length(buffer.length), padByte);
  buffer.copy(padded);
  return padded;
}

function paddedBufferFromOffset(buffer, startOffset, boundary = 8, padByte = 0x20) {
  const extra = (boundary - ((startOffset + buffer.length) % boundary)) % boundary;
  const padded = Buffer.alloc(buffer.length + extra, padByte);
  buffer.copy(padded);
  return padded;
}

function createGlb(mesh, options = {}) {
  const position = options.quantizePositions ? quantizeMeshPositions(mesh) : floatMeshPositions(mesh);
  const colorBuffer = Buffer.from(mesh.colors.buffer, mesh.colors.byteOffset, mesh.colors.byteLength);
  const materialAlpha = clampNumber(options.materialAlpha ?? 1, 0, 1);
  const positionOffset = 0;
  const colorOffset = align4Length(position.buffer.length);
  const binLength = align4Length(position.buffer.length) + align4Length(colorBuffer.length);
  const bin = Buffer.alloc(binLength);
  position.buffer.copy(bin, positionOffset);
  colorBuffer.copy(bin, colorOffset);
  const extensionsUsed = ["KHR_materials_unlit"];
  const extensionsRequired = [];
  if (position.extension) {
    extensionsUsed.push(position.extension);
    extensionsRequired.push(position.extension);
  }

  const json = {
    asset: { version: "2.0", generator: "gislifeindex-cesium-interface-v2" },
    extensionsUsed,
    ...(extensionsRequired.length ? { extensionsRequired } : {}),
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, ...(position.matrix ? { matrix: position.matrix } : {}) }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0, COLOR_0: 1 },
        mode: 4,
        material: 0
      }]
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: [1, 1, 1, materialAlpha],
        metallicFactor: 0,
        roughnessFactor: 1
      },
      ...(options.doubleSided ? { doubleSided: true } : {}),
      ...(materialAlpha < 1 ? { alphaMode: "BLEND" } : {}),
      extensions: { KHR_materials_unlit: {} }
    }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: positionOffset,
        byteLength: position.buffer.length,
        target: 34962,
        ...(position.byteStride ? { byteStride: position.byteStride } : {})
      },
      { buffer: 0, byteOffset: colorOffset, byteLength: colorBuffer.length, target: 34962 }
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: position.componentType,
        count: mesh.vertexCount,
        type: "VEC3",
        ...(position.normalized ? { normalized: true } : {}),
        min: position.min,
        max: position.max
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5121,
        count: mesh.vertexCount,
        type: "VEC4",
        normalized: true
      }
    ]
  };

  const jsonBuffer = paddedBuffer(Buffer.from(JSON.stringify(json), "utf8"));
  const header = Buffer.alloc(12);
  const jsonHeader = Buffer.alloc(8);
  const binHeader = Buffer.alloc(8);
  const byteLength = 12 + 8 + jsonBuffer.length + 8 + bin.length;
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(byteLength, 8);
  jsonHeader.writeUInt32LE(jsonBuffer.length, 0);
  jsonHeader.write("JSON", 4, "ascii");
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.write("BIN\0", 4, "ascii");
  return Buffer.concat([header, jsonHeader, jsonBuffer, binHeader, bin], byteLength);
}

function floatMeshPositions(mesh) {
  return {
    buffer: Buffer.from(mesh.positions.buffer, mesh.positions.byteOffset, mesh.positions.byteLength),
    componentType: 5126,
    normalized: false,
    min: [mesh.bounds.minX, mesh.bounds.minY, mesh.bounds.minZ],
    max: [mesh.bounds.maxX, mesh.bounds.maxY, mesh.bounds.maxZ]
  };
}

function quantizeMeshPositions(mesh) {
  const center = [
    (mesh.bounds.minX + mesh.bounds.maxX) / 2,
    (mesh.bounds.minY + mesh.bounds.maxY) / 2,
    (mesh.bounds.minZ + mesh.bounds.maxZ) / 2
  ];
  const scale = [
    Math.max(0.01, (mesh.bounds.maxX - mesh.bounds.minX) / 2),
    Math.max(0.01, (mesh.bounds.maxY - mesh.bounds.minY) / 2),
    Math.max(0.01, (mesh.bounds.maxZ - mesh.bounds.minZ) / 2)
  ];
  const buffer = Buffer.alloc(mesh.vertexCount * 8);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mesh.vertexCount; i += 1) {
    const outOffset = i * 8;
    for (let axis = 0; axis < 3; axis += 1) {
      const value = mesh.positions[i * 3 + axis];
      const normalized = clampNumber((value - center[axis]) / scale[axis], -1, 1);
      const quantized = Math.max(-32767, Math.min(32767, Math.round(normalized * 32767)));
      buffer.writeInt16LE(quantized, outOffset + axis * 2);
      const decoded = quantized / 32767;
      min[axis] = Math.min(min[axis], decoded);
      max[axis] = Math.max(max[axis], decoded);
    }
  }
  return {
    buffer,
    byteStride: 8,
    componentType: 5122,
    normalized: true,
    min,
    max,
    matrix: [
      scale[0], 0, 0, 0,
      0, scale[1], 0, 0,
      0, 0, scale[2], 0,
      center[0], center[1], center[2], 1
    ],
    extension: "KHR_mesh_quantization"
  };
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function align4Length(length) {
  return Math.ceil(length / 4) * 4;
}

function createB3dm(glb) {
  const featureTableJson = paddedBufferFromOffset(Buffer.from(JSON.stringify({ BATCH_LENGTH: 0 }), "utf8"), 28);
  const header = Buffer.alloc(28);
  const byteLength = 28 + featureTableJson.length + glb.length;
  header.write("b3dm", 0, "ascii");
  header.writeUInt32LE(1, 4);
  header.writeUInt32LE(byteLength, 8);
  header.writeUInt32LE(featureTableJson.length, 12);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(0, 20);
  header.writeUInt32LE(0, 24);
  return Buffer.concat([header, featureTableJson, glb], byteLength);
}

function createI3dm(glb, instances) {
  const count = instances.length;
  const positionOffset = 0;
  const scaleOffset = count * 12;
  const featureBinary = Buffer.alloc(scaleOffset + count * 4);
  for (let i = 0; i < count; i += 1) {
    const item = instances[i];
    featureBinary.writeFloatLE(item.position[0], positionOffset + i * 12);
    featureBinary.writeFloatLE(item.position[1], positionOffset + i * 12 + 4);
    featureBinary.writeFloatLE(item.position[2], positionOffset + i * 12 + 8);
    featureBinary.writeFloatLE(item.scale, scaleOffset + i * 4);
  }
  const featureJson = {
    INSTANCES_LENGTH: count,
    POSITION: { byteOffset: positionOffset },
    SCALE: { byteOffset: scaleOffset }
  };
  const featureTableJson = paddedBufferFromOffset(Buffer.from(JSON.stringify(featureJson), "utf8"), 32);
  const featureTableBinary = paddedBufferFromOffset(featureBinary, 32 + featureTableJson.length, 8, 0);
  const header = Buffer.alloc(32);
  const byteLength = 32 + featureTableJson.length + featureTableBinary.length + glb.length;
  header.write("i3dm", 0, "ascii");
  header.writeUInt32LE(1, 4);
  header.writeUInt32LE(byteLength, 8);
  header.writeUInt32LE(featureTableJson.length, 12);
  header.writeUInt32LE(featureTableBinary.length, 16);
  header.writeUInt32LE(0, 20);
  header.writeUInt32LE(0, 24);
  header.writeUInt32LE(1, 28);
  return Buffer.concat([header, featureTableJson, featureTableBinary, glb], byteLength);
}

function createTreeGlb(type = "leaf") {
  return createGlb(createTreeMesh(type), {
    doubleSided: true
  });
}

function createTreeMesh(type = "leaf") {
  const positions = [];
  const colors = [];
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity
  };
  const trunkColor = [102, 91, 70, 255];
  const crownColor = [94, 122, 88, 255];
  const crownColor2 = [104, 132, 96, 255];
  const coniferColor = [78, 106, 78, 255];

  const vertex = (point, color) => {
    positions.push(point[0], point[1], point[2]);
    colors.push(...color);
    bounds.minX = Math.min(bounds.minX, point[0]);
    bounds.minY = Math.min(bounds.minY, point[1]);
    bounds.minZ = Math.min(bounds.minZ, point[2]);
    bounds.maxX = Math.max(bounds.maxX, point[0]);
    bounds.maxY = Math.max(bounds.maxY, point[1]);
    bounds.maxZ = Math.max(bounds.maxZ, point[2]);
  };
  const tri = (a, b, c, color) => {
    vertex(a, color);
    vertex(b, color);
    vertex(c, color);
  };

  if (type === "conifer") {
    addCylinderTriangles(tri, 0.12, 1.2, 7, trunkColor);
    addConeTriangles(tri, 1.28, 4.25, 8, 0.92, coniferColor);
  } else {
    addCylinderTriangles(tri, 0.15, 1.55, 7, trunkColor);
    addEllipsoidTriangles(tri, [0, 0, 3.0], [1.35, 1.18, 1.65], 7, 4, crownColor);
    addEllipsoidTriangles(tri, [0.18, -0.08, 4.2], [1.05, 0.92, 1.25], 7, 4, crownColor2);
  }

  return {
    positions: new Float32Array(positions),
    colors: new Uint8Array(colors),
    vertexCount: positions.length / 3,
    bounds
  };
}

function addCylinderTriangles(tri, radius, height, sides, color) {
  const bottom = [0, 0, 0];
  const top = [0, 0, height];
  for (let i = 0; i < sides; i += 1) {
    const a = i / sides * Math.PI * 2;
    const b = (i + 1) / sides * Math.PI * 2;
    const p0 = [Math.cos(a) * radius, Math.sin(a) * radius, 0];
    const p1 = [Math.cos(b) * radius, Math.sin(b) * radius, 0];
    const p2 = [Math.cos(a) * radius, Math.sin(a) * radius, height];
    const p3 = [Math.cos(b) * radius, Math.sin(b) * radius, height];
    tri(p0, p1, p2, color);
    tri(p1, p3, p2, color);
    tri(bottom, p1, p0, color);
    tri(top, p2, p3, color);
  }
}

function addConeTriangles(tri, radius, height, sides, baseZ, color) {
  const baseCenter = [0, 0, baseZ];
  const apex = [0, 0, baseZ + height];
  for (let i = 0; i < sides; i += 1) {
    const a = i / sides * Math.PI * 2;
    const b = (i + 1) / sides * Math.PI * 2;
    const p0 = [Math.cos(a) * radius, Math.sin(a) * radius, baseZ];
    const p1 = [Math.cos(b) * radius, Math.sin(b) * radius, baseZ];
    tri(p0, p1, apex, color);
    tri(baseCenter, p1, p0, color);
  }
}

function addEllipsoidTriangles(tri, center, radii, slices, stacks, color) {
  const point = (slice, stack) => {
    const theta = slice / slices * Math.PI * 2;
    const phi = -Math.PI / 2 + stack / stacks * Math.PI;
    const cosPhi = Math.cos(phi);
    return [
      center[0] + Math.cos(theta) * cosPhi * radii[0],
      center[1] + Math.sin(theta) * cosPhi * radii[1],
      center[2] + Math.sin(phi) * radii[2]
    ];
  };
  for (let stack = 0; stack < stacks; stack += 1) {
    for (let slice = 0; slice < slices; slice += 1) {
      const a = point(slice, stack);
      const b = point(slice + 1, stack);
      const c = point(slice, stack + 1);
      const d = point(slice + 1, stack + 1);
      tri(a, b, c, color);
      tri(b, d, c, color);
    }
  }
}

function boundsFromTreeInstances(instances, model = "leaf") {
  return instances.reduce((bounds, item) => {
    const radius = (model === "conifer" ? 1.35 : 2.1) * item.scale;
    const height = (model === "conifer" ? 5.3 : 5.8) * item.scale;
    bounds.minX = Math.min(bounds.minX, item.position[0] - radius);
    bounds.minY = Math.min(bounds.minY, item.position[1] - radius);
    bounds.minZ = Math.min(bounds.minZ, item.position[2]);
    bounds.maxX = Math.max(bounds.maxX, item.position[0] + radius);
    bounds.maxY = Math.max(bounds.maxY, item.position[1] + radius);
    bounds.maxZ = Math.max(bounds.maxZ, item.position[2] + height);
    return bounds;
  }, {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity
  });
}

function boxFromBounds(bounds) {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  const hx = Math.max(1, (bounds.maxX - bounds.minX) / 2);
  const hy = Math.max(1, (bounds.maxY - bounds.minY) / 2);
  const hz = Math.max(1, (bounds.maxZ - bounds.minZ) / 2);
  return [cx, cy, cz, hx, 0, 0, 0, hy, 0, 0, 0, hz];
}

function expandBounds(bounds, xy = 0, zDown = 0, zUp = zDown) {
  return {
    minX: bounds.minX - xy,
    minY: bounds.minY - xy,
    minZ: bounds.minZ - zDown,
    maxX: bounds.maxX + xy,
    maxY: bounds.maxY + xy,
    maxZ: bounds.maxZ + zUp
  };
}

function mergeBounds(boundsList) {
  return boundsList.reduce((acc, item) => ({
    minX: Math.min(acc.minX, item.minX),
    minY: Math.min(acc.minY, item.minY),
    minZ: Math.min(acc.minZ, item.minZ),
    maxX: Math.max(acc.maxX, item.maxX),
    maxY: Math.max(acc.maxY, item.maxY),
    maxZ: Math.max(acc.maxZ, item.maxZ)
  }), {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity
  });
}

function enuTransform(center) {
  const lon = center[0] * Math.PI / 180;
  const lat = center[1] * Math.PI / 180;
  const sinLon = Math.sin(lon);
  const cosLon = Math.cos(lon);
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat);
  const x = n * cosLat * cosLon;
  const y = n * cosLat * sinLon;
  const z = n * (1 - WGS84_E2) * sinLat;
  const east = [-sinLon, cosLon, 0];
  const north = [-sinLat * cosLon, -sinLat * sinLon, cosLat];
  const up = [cosLat * cosLon, cosLat * sinLon, sinLat];
  return [
    east[0], east[1], east[2], 0,
    north[0], north[1], north[2], 0,
    up[0], up[1], up[2], 0,
    x, y, z, 1
  ];
}

function writeTileset(filePath, city, children, bounds, geometricError = 700, options = {}) {
  const tileset = {
    asset: {
      version: "1.0",
      tilesetVersion: new Date().toISOString(),
      gltfUpAxis: "Z"
    },
    geometricError,
    root: {
      transform: enuTransform(city.center),
      boundingVolume: { box: boxFromBounds(bounds) },
      geometricError,
      refine: options.refine || "ADD",
      ...(options.contentUri ? { content: { uri: options.contentUri } } : {}),
      children
    }
  };
  writeJson(filePath, tileset, true);
}

function buildBuildingTiles(city, cityOutDir) {
  const desktop = buildBuildingTilesetVariant(city, cityOutDir, {
    outName: "buildings",
    detailVariant: "standard",
    overviewVariant: "standard",
    geometricError: BUILDING_DESKTOP_GEOMETRIC_ERROR
  });
  const mobile = buildBuildingTilesetVariant(city, cityOutDir, {
    outName: "buildings-mobile",
    detailVariant: "residential",
    overviewVariant: "residential",
    geometricError: BUILDING_MOBILE_GEOMETRIC_ERROR
  });
  return {
    tileCount: desktop.tileCount,
    byteLength: desktop.byteLength,
    gzipBytes: desktop.gzipBytes,
    brotliBytes: desktop.brotliBytes,
    mobileTileCount: mobile.tileCount,
    mobileByteLength: mobile.byteLength,
    mobileGzipBytes: mobile.gzipBytes,
    mobileBrotliBytes: mobile.brotliBytes
  };
}

function buildBuildingTilesetVariant(city, cityOutDir, options) {
  const sourceBase = path.join(sourceDataDir, city.slug, "buildings");
  const tilesOut = path.join(cityOutDir, options.outName, "tiles");
  mkdirSync(tilesOut, { recursive: true });
  const children = [];
  const bounds = [];
  const detailMeshes = [];
  let byteLength = 0;
  let gzipBytes = 0;
  let brotliBytes = 0;

  for (const key of city.tiles3d?.buildings || []) {
    const source = path.join(sourceBase, `${key}-${options.detailVariant}.bin`);
    if (!existsSync(source)) continue;
    const mesh = unpackBuildingMesh(readFileSync(source));
    if (!mesh) continue;
    detailMeshes.push(mesh);
    if (BUILDING_STABLE_SINGLE_TILE) continue;
    const b3dm = createB3dm(createGlb(mesh, { quantizePositions: BUILDING_QUANTIZE_POSITIONS, doubleSided: true }));
    const fileName = `${key}.b3dm`;
    const stats = writeBinaryAsset(path.join(tilesOut, fileName), b3dm, true);
    byteLength += stats.byteLength;
    gzipBytes += stats.gzipBytes;
    brotliBytes += stats.brotliBytes;
    bounds.push(mesh.bounds);
    children.push({
      boundingVolume: { box: boxFromBounds(expandBounds(mesh.bounds, 45, 45, 90)) },
      geometricError: 0,
      content: { uri: `tiles/${fileName}` }
    });
  }

  let rootContentUri = null;
  if (BUILDING_STABLE_SINGLE_TILE && detailMeshes.length) {
    const fullMesh = mergeBuildingMeshes(detailMeshes);
    const fullB3dm = createB3dm(createGlb(fullMesh, { quantizePositions: BUILDING_QUANTIZE_POSITIONS, doubleSided: true }));
    const stats = writeBinaryAsset(path.join(tilesOut, "full.b3dm"), fullB3dm, true);
    byteLength += stats.byteLength;
    gzipBytes += stats.gzipBytes;
    brotliBytes += stats.brotliBytes;
    bounds.push(fullMesh.bounds);
    rootContentUri = "tiles/full.b3dm";
  } else {
    const overviewSource = path.join(sourceDataDir, city.slug, `buildings-overview-${options.overviewVariant}.bin`);
    if (existsSync(overviewSource)) {
      const overviewMesh = unpackBuildingMesh(readFileSync(overviewSource));
      if (overviewMesh) {
        const overviewB3dm = createB3dm(createGlb(overviewMesh, { quantizePositions: BUILDING_QUANTIZE_POSITIONS, doubleSided: true }));
        const stats = writeBinaryAsset(path.join(tilesOut, "overview.b3dm"), overviewB3dm, true);
        byteLength += stats.byteLength;
        gzipBytes += stats.gzipBytes;
        brotliBytes += stats.brotliBytes;
        bounds.push(overviewMesh.bounds);
        rootContentUri = "tiles/overview.b3dm";
      }
    }
  }

  const merged = bounds.length ? mergeBounds(bounds) : boundsFromProjectedBbox(city.projectedBbox, 0, 100);
  const tilesetBounds = expandBounds(merged, 80, 60, 120);
  if (!BUILDING_STABLE_SINGLE_TILE && children.length) {
    const sharedChildBox = boxFromBounds(tilesetBounds);
    for (const child of children) {
      // Cesium was culling some low building groups at oblique angles. The
      // building layer has only a few dozen tiles, so using the full city bounds
      // for child visibility is a deliberate stability tradeoff.
      child.boundingVolume = { box: [...sharedChildBox] };
    }
  }
  writeTileset(path.join(cityOutDir, options.outName, "tileset.json"), city, children, tilesetBounds, options.geometricError, {
    contentUri: rootContentUri,
    // Use ADD and expanded bounding volumes so the overview tile remains as a
    // fallback while detail tiles load or get culled at oblique camera angles.
    refine: "ADD"
  });
  return { tileCount: rootContentUri ? Math.max(1, children.length) : children.length, byteLength, gzipBytes, brotliBytes };
}

function buildTerrainTiles(city, cityOutDir, terrain) {
  const terrainOut = path.join(cityOutDir, "terrain");
  mkdirSync(terrainOut, { recursive: true });
  const mesh = buildTerrainMesh(terrain);
  if (!mesh) return null;
  const b3dm = createB3dm(createGlb(mesh));
  writeBinaryAsset(path.join(terrainOut, "terrain.b3dm"), b3dm, true);
  writeTileset(path.join(terrainOut, "tileset.json"), city, [{
    boundingVolume: { box: boxFromBounds(mesh.bounds) },
    geometricError: 0,
    content: { uri: "terrain.b3dm" }
  }], mesh.bounds, 500);
  return { byteLength: b3dm.length };
}

function boundsFromProjectedBbox(bbox, minZ, maxZ) {
  return {
    minX: bbox[0],
    minY: bbox[1],
    minZ,
    maxX: bbox[2],
    maxY: bbox[3],
    maxZ
  };
}

function buildCity(city) {
  const cityOutDir = path.join(outDir, city.slug);
  mkdirSync(cityOutDir, { recursive: true });
  const { terrain, treeStats } = buildCityLayers(city, cityOutDir);
  const terrainStats = buildTerrainTiles(city, cityOutDir, terrain);
  const buildingStats = buildBuildingTiles(city, cityOutDir);
  return {
    slug: city.slug,
    name: city.name,
    center: city.center,
    bbox: city.bbox,
    rank: city.rank,
    index: city.index,
    population: city.population,
    lowShare: city.lowShare,
    midShare: city.midShare,
    highShare: city.highShare,
    stats: city.stats,
    files: {
      meta: `data/${city.slug}/meta.json`,
      quartals: `data/${city.slug}/quartals.json`,
      surfaces: `data/${city.slug}/surfaces.json`,
      roads: `data/${city.slug}/roads.json`,
      roadsDetail: `data/${city.slug}/roads-detail.json`,
      points: `data/${city.slug}/points.json`,
      roadLabels: `data/${city.slug}/road-labels.json`,
      trees: `data/${city.slug}/trees/manifest.json`,
      treesTileset: treeStats?.instancedTiles ? `data/${city.slug}/trees-3d/tileset.json` : null,
      terrainTileset: terrainStats ? `data/${city.slug}/terrain/tileset.json` : null,
      buildingsTileset: `data/${city.slug}/buildings/tileset.json`,
      buildingsMobileTileset: `data/${city.slug}/buildings-mobile/tileset.json`
    },
    cesium: {
      buildingTiles: buildingStats.tileCount,
      buildingBytes: buildingStats.byteLength,
      buildingGzipBytes: buildingStats.gzipBytes,
      buildingBrotliBytes: buildingStats.brotliBytes,
      buildingMobileTiles: buildingStats.mobileTileCount,
      buildingMobileBytes: buildingStats.mobileByteLength,
      buildingMobileGzipBytes: buildingStats.mobileGzipBytes,
      buildingMobileBrotliBytes: buildingStats.mobileBrotliBytes,
      treeTiles: treeStats?.instancedTiles || 0,
      treeBytes: treeStats?.byteLength || 0,
      treeGzipBytes: treeStats?.gzipBytes || 0,
      treeBrotliBytes: treeStats?.brotliBytes || 0,
      terrainBytes: terrainStats?.byteLength || 0
    }
  };
}

cleanGenerated();
copyPublicAssets();
copyCesiumVendor();

const cities = manifest.cities.map(buildCity);
writeJson(path.join(outDir, "manifest.json"), {
  generatedAt: new Date().toISOString(),
  sourceGeneratedAt: manifest.generatedAt,
  cesiumVersion: "1.141",
  cities
}, true);

console.log(`Cesium data built: ${cities.length} cities`);
for (const city of cities) {
  console.log(`${city.name}: ${city.cesium.buildingTiles} building tiles, ${(city.cesium.buildingBytes / 1024 / 1024).toFixed(1)} MB, gzip ${(city.cesium.buildingGzipBytes / 1024 / 1024).toFixed(1)} MB, br ${(city.cesium.buildingBrotliBytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`${city.name}: ${city.cesium.treeTiles} tree i3dm tiles, ${(city.cesium.treeBytes / 1024 / 1024).toFixed(1)} MB, gzip ${(city.cesium.treeGzipBytes / 1024 / 1024).toFixed(1)} MB, br ${(city.cesium.treeBrotliBytes / 1024 / 1024).toFixed(1)} MB`);
}
