import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(siteDir, "..");
const outDir = path.join(siteDir, "data3d");
const sourceManifest = JSON.parse(readFileSync(path.join(siteDir, "data", "manifest.json"), "utf8"));

const TILE_COUNT = 8;
const OVERVIEW_AREA_THRESHOLD = 700;
const TERRAIN_GRID_WIDTH = 128;
const TERRAIN_HEIGHT_SCALE = 10;
const TERRAIN_NODATA = -32768;
const NON_MKD_HEIGHT_FACTOR = 0.48;
const MESH_MAGIC = "LIM3";
const MESH_HEADER_BYTES = 48;
const PACKED_VERTEX_BYTES = 8;
const MESH_XY_SCALE = 0.25;
const MESH_Z_SCALE = 0.1;
const sourceDirs = { orel: "Orel", tambov: "Tambov" };
const gdalBinDirs = [
  process.env.GDAL_BIN,
  "C:/MyProgram/GIS/QGIS/bin",
  "C:/MyProgram/GIS/Python310/Lib/site-packages/osgeo",
  "C:/Program Files/PostgreSQL/16/bin"
].filter(Boolean);

function assertOutputPath(target) {
  const resolved = path.resolve(target);
  if (path.basename(resolved) !== "data3d" || path.dirname(resolved) !== siteDir) {
    throw new Error(`Refusing to clean unexpected output path: ${resolved}`);
  }
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(siteDir, relativePath), "utf8"));
}

function writeJson(filePath, value, pretty = false) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, pretty ? 2 : 0));
}

function gdalTool(name) {
  for (const dir of gdalBinDirs) {
    const candidate = path.join(dir, `${name}.exe`);
    if (existsSync(candidate)) return candidate;
  }
  return name;
}

function runGdal(name, args) {
  const qgisProj = "C:/MyProgram/GIS/QGIS/share/proj";
  const qgisGdal = "C:/MyProgram/GIS/QGIS/share/gdal";
  const env = { ...process.env };
  if (existsSync(qgisProj)) env.PROJ_LIB = qgisProj;
  if (existsSync(qgisGdal)) env.GDAL_DATA = qgisGdal;
  const result = spawnSync(gdalTool(name), args, { cwd: rootDir, env, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${name} failed:\n${result.stderr || result.stdout}`);
  }
  return result;
}

function makeProjection([centerLon, centerLat]) {
  const metersPerLat = 111320;
  const metersPerLon = Math.cos((centerLat * Math.PI) / 180) * 111320;
  return ([lon, lat]) => [(lon - centerLon) * metersPerLon, (lat - centerLat) * metersPerLat];
}

function projectBbox(bbox, projection) {
  return bboxFromPoints([
    projection([bbox[0], bbox[1]]),
    projection([bbox[2], bbox[1]]),
    projection([bbox[2], bbox[3]]),
    projection([bbox[0], bbox[3]])
  ]);
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundPoint(point, digits = 1) {
  return [round(point[0], digits), round(point[1], digits)];
}

function bboxFromPoints(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [round(minX), round(minY), round(maxX), round(maxY)];
}

function bboxFromPolygons(polygons) {
  return bboxFromPoints(polygons.flat(2));
}

function geometryToPolygons(geometry, projection) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates.map((ring) => ring.map(projection))];
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon) => polygon.map((ring) => ring.map(projection)));
  }
  return [];
}

function geometryToLines(geometry, projection) {
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates.map(projection)];
  if (geometry.type === "MultiLineString") return geometry.coordinates.map((line) => line.map(projection));
  return [];
}

function geometryToPoint(geometry, projection) {
  if (geometry?.type !== "Point") return null;
  return roundPoint(projection(geometry.coordinates), 1);
}

function squaredSegmentDistance(point, a, b) {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplify(points, tolerance) {
  if (points.length <= 2 || tolerance <= 0) return points;
  const sqTolerance = tolerance * tolerance;
  const result = [points[0]];

  function simplifyRange(first, last) {
    let maxDistance = sqTolerance;
    let index = -1;
    for (let i = first + 1; i < last; i += 1) {
      const distance = squaredSegmentDistance(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }
    if (index !== -1) {
      if (index - first > 1) simplifyRange(first, index);
      result.push(points[index]);
      if (last - index > 1) simplifyRange(index, last);
    }
  }

  simplifyRange(0, points.length - 1);
  result.push(points.at(-1));
  return result;
}

function closeRing(points) {
  if (!points.length) return points;
  const first = points[0];
  const last = points.at(-1);
  if (first[0] === last[0] && first[1] === last[1]) return points;
  return [...points, first];
}

function preparePolygonFeature(feature, projection, tolerance, keepHoles = true) {
  const polygons = geometryToPolygons(feature.geometry, projection)
    .map((polygon) => {
      const rings = (keepHoles ? polygon : polygon.slice(0, 1))
        .map((ring) => {
          const open = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
          const simplified = simplify(open, tolerance);
          if (simplified.length < 3) return null;
          return closeRing(simplified.map((point) => roundPoint(point, 1)));
        })
        .filter(Boolean);
      return rings.length ? rings : null;
    })
    .filter(Boolean);
  if (!polygons.length) return null;
  return polygons;
}

function prepareQuarter(feature, index, projection) {
  const polygons = preparePolygonFeature(feature, projection, 1.5, true);
  if (!polygons) return null;
  const properties = feature.properties ?? {};
  return {
    id: String(properties.id ?? feature.id ?? index + 1),
    bbox: bboxFromPolygons(polygons),
    polygons,
    properties
  };
}

function prepareGreen(feature, projection) {
  const polygons = preparePolygonFeature(feature, projection, 3, true);
  if (!polygons) return null;
  return { bbox: bboxFromPolygons(polygons), polygons };
}

function prepareWater(feature, projection) {
  const polygons = preparePolygonFeature(feature, projection, 2, true);
  if (!polygons) return null;
  return { bbox: bboxFromPolygons(polygons), polygons };
}

function prepareBuilding(feature, index, projection, terrain) {
  const polygons = preparePolygonFeature(feature, projection, 0.35, false);
  if (!polygons) return null;
  const props = feature.properties ?? {};
  const height = Math.max(2.5, Math.min(80, Number(props.height) || 8));
  const area = Number(props.area) || 0;
  const isResidential = Number(props.residential) === 1 || props.source === "mkd" || Number(props.pop) > 0 || Number(props.floors) > 0;
  const bbox = bboxFromPolygons(polygons);
  const ground = sampleTerrain(terrain, (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2);
  return {
    id: String(props.id ?? feature.id ?? index + 1),
    bbox,
    polygons,
    h: round(height, 1),
    g: round(ground, 1),
    a: round(area, 1),
    s: props.source === "mkd" ? "mkd" : "area",
    r: isResidential ? 1 : 0
  };
}

function prepareMajorRoad(feature, projection) {
  const lines = geometryToLines(feature.geometry, projection)
    .map((line) => simplify(line, 3).map((point) => roundPoint(point, 1)))
    .filter((line) => line.length > 1);
  return lines;
}

function tileIndex(point, bbox) {
  const [minX, minY, maxX, maxY] = bbox;
  const tx = Math.max(0, Math.min(TILE_COUNT - 1, Math.floor(((point[0] - minX) / (maxX - minX || 1)) * TILE_COUNT)));
  const ty = Math.max(0, Math.min(TILE_COUNT - 1, Math.floor(((point[1] - minY) / (maxY - minY || 1)) * TILE_COUNT)));
  return `${tx}-${ty}`;
}

function tileCenter(bbox) {
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

function splitBuildings(buildings, cityDir, bbox) {
  const tiles = new Map();
  const overview = [];

  for (const building of buildings) {
    const key = tileIndex(tileCenter(building.bbox), bbox);
    if (!tiles.has(key)) tiles.set(key, []);
    tiles.get(key).push(building);
    if (building.s === "mkd" || building.a >= OVERVIEW_AREA_THRESHOLD) overview.push(building);
  }

  const buildingDir = path.join(cityDir, "buildings");
  const available = [];
  for (const [key, features] of tiles) {
    writeBuildingMeshVariants(path.join(buildingDir, key), features);
    available.push(key);
  }
  writeBuildingMeshVariants(path.join(cityDir, "buildings-overview"), overview);
  return { available: available.sort(), overview: overview.length, total: buildings.length };
}

function writeBuildingMeshVariants(basePath, features) {
  writeBuildingMesh(`${basePath}-full.bin`, features);
  writeBuildingMesh(`${basePath}-residential.bin`, features.filter(isResidentialBuilding));
}

function writeBuildingMesh(filePath, features) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const buffer = packBuildingMesh(buildBuildingMesh(features));
  writeFileSync(filePath, buffer);
  writeFileSync(`${filePath}.gz`, gzipSync(buffer, { level: 9 }));
}

function buildBuildingMesh(features) {
  const vertices = [];
  const indices = [];
  for (const feature of features) {
    const ground = feature.g || 0;
    const height = (feature.h || 8) * (feature.s === "mkd" ? 1 : NON_MKD_HEIGHT_FACTOR);
    const styles = buildingStyles(feature);
    for (const polygon of feature.polygons) {
      const outer = openRing(polygon[0]);
      if (outer.length < 3) continue;
      for (let i = 0; i < outer.length; i += 1) {
        const a = outer[i];
        const b = outer[(i + 1) % outer.length];
        pushWall(vertices, indices, a, b, ground, height, styles, wallShade(a, b));
      }
      const roofHeight = ground + height;
      const roofIndexes = new Map();
      const roofIndex = (point) => {
        const key = `${point[0]}:${point[1]}`;
        let index = roofIndexes.get(key);
        if (index == null) {
          index = pushVertex(vertices, point, roofHeight, styles.roof);
          roofIndexes.set(key, index);
        }
        return index;
      };
      for (const triangle of triangulateRoof(outer)) {
        indices.push(roofIndex(triangle[0]), roofIndex(triangle[1]), roofIndex(triangle[2]));
      }
    }
  }
  return { vertices, indices };
}

function packBuildingMesh(mesh) {
  const { vertices, indices } = mesh;
  const vertexCount = Math.floor(vertices.length / 4);
  const indexCount = indices.length;
  const indexBytes = vertexCount > 65535 ? 4 : 2;
  const indexOffset = MESH_HEADER_BYTES + vertexCount * PACKED_VERTEX_BYTES;
  const buffer = Buffer.alloc(indexOffset + indexCount * indexBytes);
  buffer.write(MESH_MAGIC, 0, "ascii");
  buffer.writeUInt32LE(vertexCount, 4);
  buffer.writeUInt32LE(indexCount, 8);
  buffer.writeUInt32LE(PACKED_VERTEX_BYTES, 32);
  buffer.writeUInt32LE(indexBytes, 36);
  buffer.writeUInt32LE(indexOffset, 40);
  if (!vertexCount) {
    buffer.writeFloatLE(0, 12);
    buffer.writeFloatLE(0, 16);
    buffer.writeFloatLE(0, 20);
    buffer.writeFloatLE(MESH_XY_SCALE, 24);
    buffer.writeFloatLE(MESH_Z_SCALE, 28);
    return buffer;
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < vertices.length; i += 4) {
    minX = Math.min(minX, vertices[i]);
    minY = Math.min(minY, vertices[i + 1]);
    minZ = Math.min(minZ, vertices[i + 2]);
    maxX = Math.max(maxX, vertices[i]);
    maxY = Math.max(maxY, vertices[i + 1]);
    maxZ = Math.max(maxZ, vertices[i + 2]);
  }

  const originX = (minX + maxX) / 2;
  const originY = (minY + maxY) / 2;
  const originZ = (minZ + maxZ) / 2;
  const xyScale = Math.max(MESH_XY_SCALE, (maxX - minX) / 65000, (maxY - minY) / 65000);
  const zScale = Math.max(MESH_Z_SCALE, (maxZ - minZ) / 65000);
  buffer.writeFloatLE(originX, 12);
  buffer.writeFloatLE(originY, 16);
  buffer.writeFloatLE(originZ, 20);
  buffer.writeFloatLE(xyScale, 24);
  buffer.writeFloatLE(zScale, 28);

  let offset = MESH_HEADER_BYTES;
  for (let i = 0; i < vertices.length; i += 4) {
    buffer.writeInt16LE(clamp(Math.round((vertices[i] - originX) / xyScale), -32768, 32767), offset);
    buffer.writeInt16LE(clamp(Math.round((vertices[i + 1] - originY) / xyScale), -32768, 32767), offset + 2);
    buffer.writeInt16LE(clamp(Math.round((vertices[i + 2] - originZ) / zScale), -32768, 32767), offset + 4);
    buffer.writeUInt8(vertices[i + 3], offset + 6);
    offset += PACKED_VERTEX_BYTES;
  }
  offset = indexOffset;
  for (const index of indices) {
    if (indexBytes === 4) {
      buffer.writeUInt32LE(index, offset);
      offset += 4;
    } else {
      buffer.writeUInt16LE(index, offset);
      offset += 2;
    }
  }
  return buffer;
}

function buildingStyles(feature) {
  const baseKind = isResidentialBuilding(feature) ? 0 : 3;
  return {
    roof: styleCode(baseKind, 1),
    sideTop: baseKind + 1,
    sideBottom: baseKind + 2
  };
}

function styleCode(kind, shade) {
  const shadeLevel = clamp(Math.round(((shade - 0.86) / 0.18) * 15), 0, 15);
  return kind * 16 + shadeLevel;
}

function isResidentialBuilding(feature) {
  return feature.r === 1 || feature.r === true || feature.s === "mkd";
}

function wallShade(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  const nx = dy / length;
  const ny = -dx / length;
  const light = nx * -0.42 + ny * -0.9;
  return clamp(0.94 + light * 0.08, 0.86, 1.04);
}

function openRing(ring) {
  const last = ring[ring.length - 1];
  if (ring.length > 1 && ring[0][0] === last[0] && ring[0][1] === last[1]) {
    return ring.slice(0, -1);
  }
  return ring;
}

function triangulateRoof(ring) {
  const points = cleanRoofRing(ring);
  if (points.length < 3) return [];
  const triangles = earClip(points);
  if (triangles.length > 0) return triangles;
  const reversedTriangles = earClip([...points].reverse());
  if (reversedTriangles.length > 0) return reversedTriangles;
  return fallbackRoofTriangles(points);
}

function cleanRoofRing(ring) {
  const cleaned = [];
  for (const point of ring) {
    const last = cleaned[cleaned.length - 1];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) cleaned.push(point);
  }
  while (cleaned.length > 2) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) break;
    cleaned.pop();
  }
  return removeCollinearPoints(cleaned);
}

function removeCollinearPoints(points) {
  if (points.length < 4) return points;
  const result = [];
  for (let i = 0; i < points.length; i += 1) {
    const prev = points[(i - 1 + points.length) % points.length];
    const current = points[i];
    const next = points[(i + 1) % points.length];
    if (Math.abs(signedTriangleArea(prev, current, next)) > 0.001) result.push(current);
  }
  return result.length >= 3 ? result : points;
}

function earClip(points) {
  const indexes = points.map((_, index) => index);
  const triangles = [];
  const orientation = polygonArea(points) >= 0 ? 1 : -1;
  let guard = 0;
  while (indexes.length > 3 && guard < points.length * points.length) {
    guard += 1;
    let clipped = false;
    for (let i = 0; i < indexes.length; i += 1) {
      const prevIndex = indexes[(i - 1 + indexes.length) % indexes.length];
      const currentIndex = indexes[i];
      const nextIndex = indexes[(i + 1) % indexes.length];
      const prev = points[prevIndex];
      const current = points[currentIndex];
      const next = points[nextIndex];
      if (!isConvexCorner(prev, current, next, orientation)) continue;
      if (containsRoofPoint(points, indexes, prevIndex, currentIndex, nextIndex, prev, current, next)) continue;
      triangles.push(orientation > 0 ? [prev, current, next] : [next, current, prev]);
      indexes.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (indexes.length === 3) {
    const tri = [points[indexes[0]], points[indexes[1]], points[indexes[2]]];
    triangles.push(orientation > 0 ? tri : [tri[2], tri[1], tri[0]]);
  }
  return indexes.length === 3 ? triangles : [];
}

function isConvexCorner(a, b, c, orientation) {
  return signedTriangleArea(a, b, c) * orientation > 0.001;
}

function containsRoofPoint(points, indexes, aIndex, bIndex, cIndex, a, b, c) {
  for (const index of indexes) {
    if (index === aIndex || index === bIndex || index === cIndex) continue;
    if (pointInTriangle(points[index], a, b, c)) return true;
  }
  return false;
}

function pointInTriangle(point, a, b, c) {
  const area1 = signedTriangleArea(point, a, b);
  const area2 = signedTriangleArea(point, b, c);
  const area3 = signedTriangleArea(point, c, a);
  const epsilon = 0.001;
  const hasNegative = area1 < -epsilon || area2 < -epsilon || area3 < -epsilon;
  const hasPositive = area1 > epsilon || area2 > epsilon || area3 > epsilon;
  if (hasNegative && hasPositive) return false;
  return Math.abs(area1) > epsilon && Math.abs(area2) > epsilon && Math.abs(area3) > epsilon;
}

function fallbackRoofTriangles(points) {
  if (!isConvexPolygon(points)) return [];
  const triangles = [];
  const orientation = polygonArea(points) >= 0 ? 1 : -1;
  for (let i = 1; i < points.length - 1; i += 1) {
    const triangle = [points[0], points[i], points[i + 1]];
    triangles.push(orientation > 0 ? triangle : [triangle[2], triangle[1], triangle[0]]);
  }
  return triangles;
}

function isConvexPolygon(points) {
  const orientation = polygonArea(points) >= 0 ? 1 : -1;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[(i - 1 + points.length) % points.length];
    const b = points[i];
    const c = points[(i + 1) % points.length];
    if (signedTriangleArea(a, b, c) * orientation < -0.001) return false;
  }
  return true;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function signedTriangleArea(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function pushWall(vertices, indices, a, b, ground, height, styles, shade) {
  const top = styleCode(styles.sideTop, shade);
  const bottom = styleCode(styles.sideBottom, shade);
  const roof = ground + height;
  const aBottom = pushVertex(vertices, a, ground, bottom);
  const bBottom = pushVertex(vertices, b, ground, bottom);
  const bTop = pushVertex(vertices, b, roof, top);
  const aTop = pushVertex(vertices, a, roof, top);
  indices.push(aBottom, bBottom, bTop, aBottom, bTop, aTop);
}

function pushVertex(target, point, z, style) {
  target.push(point[0], point[1], z, style);
  return target.length / 4 - 1;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function splitRoadSegments(collection, projection, cityDir, bbox) {
  const tiles = new Map();
  for (const feature of collection.features) {
    for (const line of geometryToLines(feature.geometry, projection)) {
      const simplified = simplify(line, 2);
      for (let i = 0; i < simplified.length - 1; i += 1) {
        const a = roundPoint(simplified[i], 1);
        const b = roundPoint(simplified[i + 1], 1);
        const key = tileIndex([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bbox);
        if (!tiles.has(key)) tiles.set(key, []);
        tiles.get(key).push([a, b]);
      }
    }
  }

  const roadDir = path.join(cityDir, "roads-all");
  const available = [];
  for (const [key, segments] of tiles) {
    writeJson(path.join(roadDir, `${key}.json`), { segments });
    available.push(key);
  }
  return available.sort();
}

function preparePoints(collection, projection) {
  return collection.features
    .map((feature) => {
      const point = geometryToPoint(feature.geometry, projection);
      if (!point) return null;
      return { point, properties: feature.properties ?? {} };
    })
    .filter(Boolean);
}

function demPathForCity(city) {
  const sourceDir = sourceDirs[city.slug];
  return sourceDir ? path.join(rootDir, sourceDir, "GPKG", "dem.tif") : null;
}

function prepareTerrain(city, projection, cityDir) {
  const demPath = demPathForCity(city);
  if (!demPath || !existsSync(demPath)) return null;

  const safeSlug = city.slug.replace(/[^a-z0-9_-]/gi, "");
  const tempTif = path.join(cityDir, `_${safeSlug}_terrain_wgs.tif`);
  const tempXyz = path.join(cityDir, `_${safeSlug}_terrain.xyz`);
  for (const temp of [tempTif, tempXyz, `${tempTif}.aux.xml`]) rmSync(temp, { force: true });

  runGdal("gdalwarp", [
    "-overwrite",
    "-t_srs",
    "EPSG:4326",
    "-ts",
    String(TERRAIN_GRID_WIDTH),
    "0",
    "-r",
    "bilinear",
    "-srcnodata",
    String(TERRAIN_NODATA),
    "-dstnodata",
    String(TERRAIN_NODATA),
    demPath,
    tempTif
  ]);
  runGdal("gdal_translate", ["-of", "XYZ", tempTif, tempXyz]);

  const terrain = terrainFromXyz(tempXyz, projection);
  rmSync(tempTif, { force: true });
  rmSync(tempXyz, { force: true });
  rmSync(`${tempTif}.aux.xml`, { force: true });
  if (!terrain) return null;
  writeJson(path.join(cityDir, "terrain.json"), terrain);
  return terrain;
}

function terrainFromXyz(filePath, projection) {
  const lines = readFileSync(filePath, "utf8").trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return null;

  const rows = [];
  let currentY = null;
  let currentRow = [];
  for (const line of lines) {
    const [lonText, latText, elevationText] = line.trim().split(/\s+/);
    const lon = Number(lonText);
    const lat = Number(latText);
    const elevation = Number(elevationText);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    if (currentY === null) currentY = lat;
    if (Math.abs(lat - currentY) > 1e-10) {
      rows.push(currentRow);
      currentRow = [];
      currentY = lat;
    }
    currentRow.push({ lon, lat, elevation });
  }
  if (currentRow.length) rows.push(currentRow);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  if (height < 2 || width < 2) return null;

  const values = [];
  const points = [];
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  for (const row of rows) {
    for (const item of row) {
      const point = projection([item.lon, item.lat]);
      points.push(point);
      const valid = Number.isFinite(item.elevation) && item.elevation !== TERRAIN_NODATA;
      values.push(valid ? item.elevation : null);
      if (valid) {
        minElevation = Math.min(minElevation, item.elevation);
        maxElevation = Math.max(maxElevation, item.elevation);
      }
    }
  }
  if (!Number.isFinite(minElevation) || !Number.isFinite(maxElevation)) return null;

  const filled = fillMissingTerrain(values, width, height, minElevation);
  const bbox = bboxFromPoints(points);
  return {
    width,
    height,
    bbox,
    minElevation: round(minElevation, 2),
    maxElevation: round(maxElevation, 2),
    scale: TERRAIN_HEIGHT_SCALE,
    h: filled.map((value) => Math.max(0, Math.round((value - minElevation) * TERRAIN_HEIGHT_SCALE)))
  };
}

function fillMissingTerrain(values, width, height, fallback) {
  let filled = values.slice();
  let missing = filled.reduce((count, value) => count + (Number.isFinite(value) ? 0 : 1), 0);
  let guard = 0;
  while (missing > 0 && guard < width + height) {
    guard += 1;
    const next = filled.slice();
    let changed = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        if (Number.isFinite(filled[index])) continue;
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const value = filled[ny * width + nx];
            if (!Number.isFinite(value)) continue;
            sum += value;
            count += 1;
          }
        }
        if (count > 0) {
          next[index] = sum / count;
          changed += 1;
        }
      }
    }
    filled = next;
    missing -= changed;
    if (changed === 0) break;
  }
  if (missing > 0) {
    filled = filled.map((value) => (Number.isFinite(value) ? value : fallback));
  }
  return filled;
}

function sampleTerrain(terrain, x, y) {
  if (!terrain || !terrain.h?.length) return 0;
  const [minX, minY, maxX, maxY] = terrain.bbox;
  if (x < minX || x > maxX || y < minY || y > maxY) return 0;
  const col = ((x - minX) / (maxX - minX || 1)) * (terrain.width - 1);
  const row = ((maxY - y) / (maxY - minY || 1)) * (terrain.height - 1);
  const x0 = Math.floor(col);
  const y0 = Math.floor(row);
  const x1 = Math.min(terrain.width - 1, x0 + 1);
  const y1 = Math.min(terrain.height - 1, y0 + 1);
  const tx = col - x0;
  const ty = row - y0;
  const scale = terrain.scale || 1;
  const valueAt = (cx, cy) => (terrain.h[cy * terrain.width + cx] || 0) / scale;
  const top = valueAt(x0, y0) * (1 - tx) + valueAt(x1, y0) * tx;
  const bottom = valueAt(x0, y1) * (1 - tx) + valueAt(x1, y1) * tx;
  return top * (1 - ty) + bottom * ty;
}

assertOutputPath(outDir);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const data3dManifest = {
  generatedAt: new Date().toISOString(),
  tileCount: TILE_COUNT,
  overviewAreaThreshold: OVERVIEW_AREA_THRESHOLD,
  cities: []
};

for (const city of sourceManifest.cities) {
  const cityDir = path.join(outDir, city.slug);
  mkdirSync(cityDir, { recursive: true });

  const center = [(city.bbox[0] + city.bbox[2]) / 2, (city.bbox[1] + city.bbox[3]) / 2];
  const projection = makeProjection(center);
  const projectedBbox = projectBbox(city.bbox, projection);
  const terrain = prepareTerrain(city, projection, cityDir);

  const quartals = readJson(city.files.quartals).features
    .map((feature, index) => prepareQuarter(feature, index, projection))
    .filter(Boolean);
  const green = readJson(city.files.green).features
    .map((feature) => prepareGreen(feature, projection))
    .filter(Boolean);
  const water = readJson(city.files.water).features
    .map((feature) => prepareWater(feature, projection))
    .filter(Boolean);
  const buildings = readJson(city.files.buildings).features
    .map((feature, index) => prepareBuilding(feature, index, projection, terrain))
    .filter(Boolean);
  const roads = readJson(city.files.roads).features
    .flatMap((feature) => prepareMajorRoad(feature, projection));
  const railways = readJson(city.files.railways).features
    .flatMap((feature) => prepareMajorRoad(feature, projection));
  const roadsAll = readJson(city.files.roadsAll);
  const stops = preparePoints(readJson(city.files.stops), projection);
  const dtp = preparePoints(readJson(city.files.dtp), projection);
  const mkdUnmatched = existsSync(path.join(siteDir, city.files.mkdUnmatched))
    ? preparePoints(readJson(city.files.mkdUnmatched), projection)
    : [];

  const buildingStats = splitBuildings(buildings, cityDir, projectedBbox);
  const availableRoadTiles = splitRoadSegments(roadsAll, projection, cityDir, projectedBbox);

  writeJson(path.join(cityDir, "quartals.json"), { features: quartals });
  writeJson(path.join(cityDir, "green.json"), { features: green });
  writeJson(path.join(cityDir, "water.json"), { features: water });
  writeJson(path.join(cityDir, "roads.json"), { lines: roads });
  writeJson(path.join(cityDir, "railways.json"), { lines: railways });
  writeJson(path.join(cityDir, "stops.json"), { items: stops });
  writeJson(path.join(cityDir, "dtp.json"), { items: dtp });

  data3dManifest.cities.push({
    ...city,
    center,
    projectedBbox,
    tileCount: TILE_COUNT,
    files3d: {
      quartals: `data3d/${city.slug}/quartals.json`,
      green: `data3d/${city.slug}/green.json`,
      water: `data3d/${city.slug}/water.json`,
      roads: `data3d/${city.slug}/roads.json`,
      railways: `data3d/${city.slug}/railways.json`,
      stops: `data3d/${city.slug}/stops.json`,
      dtp: `data3d/${city.slug}/dtp.json`,
      terrain: terrain ? `data3d/${city.slug}/terrain.json` : null,
      buildingsOverviewBase: `data3d/${city.slug}/buildings-overview`,
      buildingsTileBase: `data3d/${city.slug}/buildings`,
      roadsAllTileBase: `data3d/${city.slug}/roads-all`
    },
    tiles3d: {
      buildings: buildingStats.available,
      roadsAll: availableRoadTiles
    },
    stats3d: {
      buildings: buildingStats.total,
      buildingsOverview: buildingStats.overview,
      roadAllTiles: availableRoadTiles.length
    }
  });

  console.log(
    `${city.slug}: ${quartals.length} quarters, ${buildingStats.total} buildings, ${buildingStats.overview} overview buildings, ${availableRoadTiles.length} road tiles`
  );
}

writeJson(path.join(outDir, "manifest.json"), data3dManifest, true);
console.log(`Created ${outDir}`);
