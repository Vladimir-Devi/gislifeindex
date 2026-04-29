import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(siteDir, "data3d");
const sourceManifest = JSON.parse(readFileSync(path.join(siteDir, "data", "manifest.json"), "utf8"));

const TILE_COUNT = 8;
const OVERVIEW_AREA_THRESHOLD = 700;
const BUILDING_COORD_SCALE = 10;

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

function prepareBuilding(feature, index, projection) {
  const polygons = preparePolygonFeature(feature, projection, 0.35, false);
  if (!polygons) return null;
  const props = feature.properties ?? {};
  const height = Math.max(2.5, Math.min(80, Number(props.height) || 8));
  const area = Number(props.area) || 0;
  const isResidential = Number(props.residential) === 1 || props.source === "mkd" || Number(props.pop) > 0 || Number(props.floors) > 0;
  return {
    id: String(props.id ?? feature.id ?? index + 1),
    bbox: bboxFromPolygons(polygons),
    polygons,
    h: round(height, 1),
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
    writeJson(path.join(buildingDir, `${key}.json`), compactBuildings(features));
    available.push(key);
  }
  writeJson(path.join(cityDir, "buildings-overview.json"), compactBuildings(overview));
  return { available: available.sort(), overview: overview.length, total: buildings.length };
}

function compactBuildings(features) {
  return {
    f: "b1",
    s: BUILDING_COORD_SCALE,
    b: features.map(compactBuilding)
  };
}

function compactBuilding(feature) {
  const rings = [];
  for (const polygon of feature.polygons) {
    if (!polygon[0] || polygon[0].length < 3) continue;
    rings.push(compactRing(polygon[0]));
  }
  return [
    Math.round(feature.h * BUILDING_COORD_SCALE),
    feature.s === "mkd" ? 1 : 0,
    feature.r ? 1 : 0,
    ...rings
  ];
}

function compactRing(ring) {
  const open = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
  return open.flatMap((point) => [
    Math.round(point[0] * BUILDING_COORD_SCALE),
    Math.round(point[1] * BUILDING_COORD_SCALE)
  ]);
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
    .map((feature, index) => prepareBuilding(feature, index, projection))
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
  writeJson(path.join(cityDir, "points.json"), { stops, dtp, mkdUnmatched });

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
      points: `data3d/${city.slug}/points.json`,
      buildingsOverview: `data3d/${city.slug}/buildings-overview.json`,
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
