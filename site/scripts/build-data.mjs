import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(siteDir, "..");
const rawDir = path.join(siteDir, "data", "_raw");
const outDir = path.join(siteDir, "data");

const cities = [
  {
    slug: "orel",
    sourceDir: "Orel",
    populationOverride: 282314,
    summaryName: "Орел",
    displayName: "Орёл",
    indexLayer: "kvartals_life_index_compare_site",
    quarterPopulationFields: ["pop_sum_2"],
    buildingsLayer: "building_all_site",
    buildingSelect: ["area", "Тип дома", "Тип дома_2", "Тип помещения (блока)", "Тип помещения (блока)_2", "pop", "pop_2", "pop_formula", "pop_formula_2", "zhil_area", "zhil_area_2"],
    buildingWhere: "area >= 25",
    greenLayer: "green_zone",
    waterLayer: "water_site",
    railwayLayer: "railway_site",
    boundaryLayer: "boundary",
    roadLayer: "road_auto_site",
    roadAllLayer: "road_all_site",
    mkdLayer: "mkd",
    mkdFields: ["address", "floor_num", "pop"],
    mkdWhere: "lon >= 35 AND lon <= 37 AND lat >= 52 AND lat <= 54",
    stopLayers: ["bus_stop", "tram_stop"],
    dtpLayer: "dtp24",
    dtpAliases: {
      injured: ["injured", "Раненые"],
      dead: ["dead", "Погибшие"]
    }
  },
  {
    slug: "tambov",
    sourceDir: "Tambov",
    populationOverride: 248808,
    summaryName: "Тамбов",
    displayName: "Тамбов",
    indexLayer: "kvartals_life_index_compare_site",
    quarterPopulationFields: ["pop_sum"],
    buildingsLayer: "building_site",
    buildingSelect: ["area", "Тип дома", "Тип дома_2", "Тип помещения (блока)", "Тип помещения (блока)_2", "pop", "pop_2", "floor", "floor_2", "build_type", "build_type_2"],
    buildingWhere: "area IS NULL OR area >= 21",
    greenLayer: "green_zone",
    waterLayer: "water_site",
    railwayLayer: "railway_site",
    boundaryLayer: "boundary",
    roadLayer: "road_auto_site",
    roadAllLayer: "road_all_site",
    mkdLayer: "mkd_plus",
    mkdFields: ["address", "floor", "pop"],
    mkdWhere: "lon >= 41 AND lon <= 42 AND lat >= 52 AND lat <= 53",
    stopLayers: ["bus_stop"],
    dtpLayer: "dtp24_25",
    dtpAliases: {
      injured: ["injured", "Раненые"],
      dead: ["dead", "Погибшие"]
    }
  }
];

const blockKeys = ["housing", "infra", "transport", "work", "green", "commerce"];
const indicatorAliases = [
  ["Жильё: плотность", ["zhil_usl_density", "zhil_usl_pltn"]],
  ["Жильё: обеспеченность", ["zhil_usl_obespech_zhil", "zhil_usl_obespech"]],
  ["Жильё: износ", ["zhil_usl_srdnvzv_izns"]],
  ["Жильё: этажность", ["zhil_usl_floor_num_mean", "zhil_usl_floor_mean"]],
  ["Коммерческая инфраструктура: разнообразие", ["infr_funk_diversity", "soc_infr_funk_diversity", "soc_infr_diversity"]],
  ["Коммерческая инфраструктура: полнота корзины", ["infr_ind_poln", "soc_infr_ind_poln"]],
  ["Транспорт: доступность", ["trnsp_bezop_dostup_dostup", "trnsp_bezop_dostup"]],
  ["Крупные работодатели: обеспеченность", ["zanyatost_obespech", "zanyatost_obespech_coef", "zanyatost_index_obespech", "zanyatost_index_obespech_coef"]],
  ["Крупные работодатели: плотность", ["zanyatost_density", "zanyatost_index_density"]],
  ["Зелёные зоны: доступность", ["green_zone_dostup"]],
  ["Экономика: активность ФНС", ["commerce_fns_activity_idx"]],
  ["Экономика: ККТ", ["commerce_fns_kkt_est"]],
  ["Экономика: медианный чек", ["commerce_fns_median_check_proxy"]]
];

mkdirSync(rawDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

function run(command, args) {
  const result = spawnSync(command, args, { cwd: rootDir, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${command} failed with code ${result.status}`);
  }
}

function exportLayer({ output, input, layer, sql, select, where }) {
  if (existsSync(output)) rmSync(output, { force: true });
  const args = [
    "-f",
    "GeoJSON",
    output,
    input,
    "-t_srs",
    "EPSG:4326",
    "-lco",
    "RFC7946=YES",
    "-lco",
    "COORDINATE_PRECISION=6",
    "-skipfailures"
  ];
  if (sql) args.push("-sql", sql);
  else args.push(layer);
  if (select?.length) args.push("-select", select.join(","));
  if (where) args.push("-where", where);
  run("ogr2ogr", args);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, data, pretty = false) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, pretty ? 2 : 0), "utf8");
}

function parseCsv(file) {
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split(",");
  return lines.map((line) => {
    const parts = line.split(",");
    return Object.fromEntries(header.map((key, index) => [key, parts[index] ?? ""]));
  });
}

function cleanProperties(properties = {}) {
  const result = {};
  for (const [key, value] of Object.entries(properties)) {
    result[key.trim()] = value;
  }
  return result;
}

function number(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = String(value).replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!normalized) return null;
  const parsed = Number(normalized[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreRatio(value) {
  const parsed = number(value);
  if (parsed === null) return null;
  return parsed > 1 ? parsed / 100 : parsed;
}

function comparisonBlocks(properties, suffix) {
  return {
    housing: scoreRatio(properties[`idx_housing_${suffix}`] ?? properties.idx_housing),
    infra: scoreRatio(properties[`idx_infra_${suffix}`] ?? properties.idx_infra),
    transport: scoreRatio(properties[`idx_transport_${suffix}`] ?? properties.idx_transport),
    work: scoreRatio(properties[`idx_work_${suffix}`] ?? properties.idx_work),
    green: scoreRatio(properties[`idx_green_${suffix}`] ?? properties.idx_green),
    commerce: scoreRatio(properties[`idx_commerce_${suffix}`] ?? properties.idx_commerce)
  };
}

function comparisonValues(properties, suffix) {
  return {
    score: number(properties[`idx_life_${suffix}`] ?? properties.idx_life_100),
    rank: number(properties[`rank_${suffix}`] ?? properties.idx_rank),
    blocks: comparisonBlocks(properties, suffix)
  };
}

function firstNumber(properties, names) {
  for (const name of names) {
    const value = number(properties[name]);
    if (value !== null) return value;
  }
  return null;
}

function firstText(properties, names) {
  for (const name of names) {
    const value = properties[name];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

const defaultQuarterPopulationFields = ["pop_sum", "population", "population_est", "pop"];

function hasAnyProperty(properties, names) {
  return names.some((name) => Object.prototype.hasOwnProperty.call(properties, name));
}

function layerPopulationFields(city) {
  return city.quarterPopulationFields?.length ? city.quarterPopulationFields : defaultQuarterPopulationFields;
}

function layerPopulationStats(features, city) {
  const fields = layerPopulationFields(city);
  let sum = 0;
  let withPopulation = 0;
  let withField = 0;

  for (const feature of features) {
    const props = cleanProperties(feature.properties);
    if (hasAnyProperty(props, fields)) withField += 1;
    const value = firstNumber(props, fields);
    if (value !== null) {
      sum += value;
      if (value > 0) withPopulation += 1;
    }
  }

  const total = features.length || 1;
  const coverage = withPopulation / total;
  const target = city.populationOverride;
  const relativeDiff = target ? Math.abs(sum - target) / target : 0;
  const authoritative = withField > 0 && coverage >= 0.75 && (!target || relativeDiff <= 0.05);

  return { sum, withPopulation, withField, coverage, authoritative, fields };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function seededUnit(seed) {
  let x = Math.sin(Number(seed) * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function forEachPosition(geometry, callback) {
  if (!geometry) return;
  const walk = (coordinates) => {
    if (!Array.isArray(coordinates)) return;
    if (typeof coordinates[0] === "number") {
      callback(coordinates);
      return;
    }
    for (const child of coordinates) walk(child);
  };
  walk(geometry.coordinates);
}

function geometryBbox(geometry) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  forEachPosition(geometry, ([x, y]) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  if (!Number.isFinite(minX)) return null;
  return [minX, minY, maxX, maxY];
}

function combineBbox(a, b) {
  if (!b) return a;
  if (!a) return [...b];
  a[0] = Math.min(a[0], b[0]);
  a[1] = Math.min(a[1], b[1]);
  a[2] = Math.max(a[2], b[2]);
  a[3] = Math.max(a[3], b[3]);
  return a;
}

function ringContainsPoint(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonContainsPoint(rings, x, y) {
  if (!ringContainsPoint(rings[0], x, y)) return false;
  for (let i = 1; i < rings.length; i += 1) {
    if (ringContainsPoint(rings[i], x, y)) return false;
  }
  return true;
}

function geometryContainsPoint(geometry, x, y) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return polygonContainsPoint(geometry.coordinates, x, y);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => polygonContainsPoint(polygon, x, y));
  }
  return false;
}

function pickIndicators(properties) {
  const indicators = [];
  for (const [label, aliases] of indicatorAliases) {
    const value = firstNumber(properties, aliases);
    if (value !== null) indicators.push({ label, value });
  }
  return indicators;
}

function quarterFeature(feature, city, populationByFid, index, populationOptions) {
  const props = cleanProperties(feature.properties);
  const fid = String(props.source_fid ?? props.fid ?? feature.id ?? index + 1);
  const compare = {
    city: comparisonValues(props, "city"),
    all: comparisonValues(props, "all")
  };
  const blocks = compare.city.blocks;
  const hasLayerPopulationField = hasAnyProperty(props, populationOptions.fields);
  const layerPopulation = firstNumber(props, populationOptions.fields);
  const population = populationOptions.authoritative && hasLayerPopulationField
    ? layerPopulation ?? 0
    : layerPopulation ?? populationByFid.get(fid) ?? null;
  return {
    type: "Feature",
    id: fid,
    properties: {
      id: fid,
      city: city.slug,
      baseScore: compare.city.score,
      baseScoreNoCommerce: number(props.idx_life_no_commerce_100),
      baseRank: compare.city.rank,
      population,
      blocks,
      compare,
      indicators: pickIndicators(props)
    },
    geometry: feature.geometry
  };
}

function indexBuildings(buildings) {
  const cellSize = 0.001;
  const grid = new Map();
  for (let index = 0; index < buildings.length; index += 1) {
    const bbox = buildings[index].properties.bbox;
    if (!bbox) continue;
    const minX = Math.floor(bbox[0] / cellSize);
    const minY = Math.floor(bbox[1] / cellSize);
    const maxX = Math.floor(bbox[2] / cellSize);
    const maxY = Math.floor(bbox[3] / cellSize);
    for (let gx = minX; gx <= maxX; gx += 1) {
      for (let gy = minY; gy <= maxY; gy += 1) {
        const key = `${gx}:${gy}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(index);
      }
    }
  }
  return { grid, cellSize };
}

function candidateBuildingIndexes(index, x, y) {
  const gx = Math.floor(x / index.cellSize);
  const gy = Math.floor(y / index.cellSize);
  return index.grid.get(`${gx}:${gy}`) ?? [];
}

function buildBuildings(rawBuildings, rawMkd, city) {
  const buildingTypeFields = [
    "Тип поля",
    "Тип поля_2",
    "Тип дома",
    "Тип дома_2",
    "Тип помещения (блока)",
    "Тип помещения (блока)_2",
    "build_type",
    "build_type_2"
  ];
  const buildings = rawBuildings.features
    .filter((feature) => feature.geometry)
    .map((feature, index) => {
      const props = cleanProperties(feature.properties);
      const area = number(props.area) ?? 0;
      const id = String(props.fid ?? feature.id ?? index + 1);
      const buildingType = firstText(props, city.buildingTypeFields ?? buildingTypeFields);
      const randomPart = seededUnit(id) * 8;
      let height = clamp(4 + Math.sqrt(Math.max(area, 1)) * 0.22 + randomPart, 4, 32);
      if (area > 4000) height *= 0.5;
      return {
        type: "Feature",
        id,
        properties: {
          id,
          area,
          height: Math.round(height * 10) / 10,
          source: "area",
          floors: null,
          pop: null,
          buildingType,
          residential: buildingType ? 1 : 0,
          bbox: geometryBbox(feature.geometry)
        },
        geometry: feature.geometry
      };
    });

  const spatialIndex = indexBuildings(buildings);
  const unmatchedMkd = [];

  for (const feature of rawMkd.features.filter((item) => item.geometry?.type === "Point")) {
    const props = cleanProperties(feature.properties);
    const [x, y] = feature.geometry.coordinates;
    const floors = firstNumber(props, ["floor", "floor_num", "floor_num_gisjkh"]);
    if (!floors || floors < 1) continue;
    const height = clamp(floors * 3.1 + 1, 4, 95);
    let bestIndex = null;
    let bestArea = Infinity;
    for (const candidate of candidateBuildingIndexes(spatialIndex, x, y)) {
      const building = buildings[candidate];
      const bbox = building.properties.bbox;
      if (!bbox || x < bbox[0] || x > bbox[2] || y < bbox[1] || y > bbox[3]) continue;
      if (!geometryContainsPoint(building.geometry, x, y)) continue;
      if (building.properties.area < bestArea) {
        bestArea = building.properties.area;
        bestIndex = candidate;
      }
    }
    if (bestIndex !== null) {
      const target = buildings[bestIndex].properties;
      const adjustedHeight = target.area > 4000 ? height * 0.5 : height;
      target.height = Math.round(Math.max(target.height, adjustedHeight) * 10) / 10;
      target.source = "mkd";
      target.floors = floors;
      target.pop = number(props.pop);
      target.residential = 1;
    } else {
      unmatchedMkd.push({
        type: "Feature",
        properties: {
          address: props.address ?? "",
          floors,
          height: Math.round(height * 10) / 10,
          pop: number(props.pop)
        },
        geometry: feature.geometry
      });
    }
  }

  for (const feature of buildings) delete feature.properties.bbox;
  return { buildings, unmatchedMkd };
}

function pointCollection(raw, source) {
  return {
    type: "FeatureCollection",
    features: raw.features
      .filter((feature) => feature.geometry?.type === "Point")
      .map((feature, index) => ({
        type: "Feature",
        id: feature.id ?? index + 1,
        properties: { source, name: feature.properties?.name ?? feature.properties?.NAME ?? "" },
        geometry: feature.geometry
      }))
  };
}

function accidentCollection(raw, aliases) {
  return {
    type: "FeatureCollection",
    features: raw.features
      .filter((feature) => feature.geometry?.type === "Point")
      .map((feature, index) => {
        const props = cleanProperties(feature.properties);
        const injured = firstNumber(props, aliases.injured) ?? 0;
        const dead = firstNumber(props, aliases.dead) ?? 0;
        return {
          type: "Feature",
          id: feature.id ?? index + 1,
          properties: {
            source: "dtp",
            injured,
            dead,
            severity: injured + dead * 3,
            date: props.date ?? props["Дата"] ?? "",
            time: props.time ?? props["Время"] ?? "",
            address: props.address ?? props["Адрес"] ?? "",
            type: props.dtp_type ?? props["Тип ДТП"] ?? ""
          },
          geometry: feature.geometry
        };
      })
  };
}

function mergeFeatureCollections(collections) {
  return {
    type: "FeatureCollection",
    features: collections.flatMap((collection) => collection.features ?? [])
  };
}

function featureCollectionContainsPoint(collection, x, y) {
  return (collection.features ?? []).some((feature) => {
    const bbox = geometryBbox(feature.geometry);
    if (!bbox || x < bbox[0] || x > bbox[2] || y < bbox[1] || y > bbox[3]) return false;
    return geometryContainsPoint(feature.geometry, x, y);
  });
}

function clipPointsToBoundary(collection, boundary) {
  return {
    type: "FeatureCollection",
    features: (collection.features ?? []).filter((feature) => {
      const coordinates = feature.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return false;
      return featureCollectionContainsPoint(boundary, coordinates[0], coordinates[1]);
    })
  };
}

function makePopulationLookup(rows, cityName) {
  const lookup = new Map();
  for (const row of rows) {
    if (row.city !== cityName) continue;
    const fid = String(row.fid);
    lookup.set(fid, number(row.population_est));
  }
  return lookup;
}

function summaryLookup(rows) {
  return new Map(rows.map((row) => [row.city, row]));
}

function exportCity(city) {
  const sourceBase = path.join(rootDir, city.sourceDir, "GPKG");
  const rawBase = path.join(rawDir, city.slug);
  mkdirSync(rawBase, { recursive: true });

  exportLayer({
    output: path.join(rawBase, "quartals.geojson"),
    input: path.join(sourceBase, "index_normalized.gpkg"),
    layer: city.indexLayer,
    sql: `SELECT source_fid AS source_fid, * FROM ${city.indexLayer}`
  });
  exportLayer({
    output: path.join(rawBase, "buildings.geojson"),
    input: path.join(sourceBase, "osnova.gpkg"),
    layer: city.buildingsLayer,
    select: city.buildingSelect,
    where: city.buildingWhere
  });
  exportLayer({
    output: path.join(rawBase, "green.geojson"),
    input: path.join(sourceBase, "osnova.gpkg"),
    layer: city.greenLayer
  });
  exportLayer({
    output: path.join(rawBase, "water.geojson"),
    input: path.join(sourceBase, "osnova.gpkg"),
    layer: city.waterLayer
  });
  exportLayer({
    output: path.join(rawBase, "railways.geojson"),
    input: path.join(sourceBase, "osnova.gpkg"),
    layer: city.railwayLayer
  });
  exportLayer({
    output: path.join(rawBase, "boundary.geojson"),
    input: path.join(sourceBase, "osnova.gpkg"),
    layer: city.boundaryLayer
  });
  exportLayer({
    output: path.join(rawBase, "roads.geojson"),
    input: path.join(sourceBase, "road.gpkg"),
    layer: city.roadLayer
  });
  exportLayer({
    output: path.join(rawBase, "roads-all.geojson"),
    input: path.join(sourceBase, "road.gpkg"),
    layer: city.roadAllLayer
  });
  exportLayer({
    output: path.join(rawBase, "mkd.geojson"),
    input: path.join(sourceBase, "osnova.gpkg"),
    layer: city.mkdLayer,
    select: city.mkdFields,
    where: city.mkdWhere
  });
  exportLayer({
    output: path.join(rawBase, "dtp.geojson"),
    input: path.join(sourceBase, "dtp.gpkg"),
    layer: city.dtpLayer
  });
  for (const stopLayer of city.stopLayers) {
    exportLayer({
      output: path.join(rawBase, `${stopLayer}.geojson`),
      input: path.join(sourceBase, "transport.gpkg"),
      layer: stopLayer
    });
  }
}

function prepareCity(city, populationRows) {
  const rawBase = path.join(rawDir, city.slug);
  const cityOut = path.join(outDir, city.slug);
  mkdirSync(cityOut, { recursive: true });

  const populationByFid = makePopulationLookup(populationRows, city.summaryName);
  const rawQuartals = readJson(path.join(rawBase, "quartals.geojson"));
  const populationOptions = layerPopulationStats(rawQuartals.features.filter((feature) => feature.geometry), city);
  console.log(
    `${city.slug}: quarter population source ${populationOptions.authoritative ? "layer" : "fallback"}, ` +
      `layer sum ${Math.round(populationOptions.sum)}, coverage ${(populationOptions.coverage * 100).toFixed(1)}%`
  );
  const quartals = rawQuartals.features
    .filter((feature) => feature.geometry)
    .map((feature, index) => quarterFeature(feature, city, populationByFid, index, populationOptions));
  const quarterPopulationSum = quartals.reduce((sum, feature) => sum + (number(feature.properties.population) ?? 0), 0);
  const bbox = quartals.reduce((acc, feature) => combineBbox(acc, geometryBbox(feature.geometry)), null);

  const rawBuildings = readJson(path.join(rawBase, "buildings.geojson"));
  const rawMkd = readJson(path.join(rawBase, "mkd.geojson"));
  const boundary = readJson(path.join(rawBase, "boundary.geojson"));
  const { buildings, unmatchedMkd } = buildBuildings(rawBuildings, rawMkd, city);

  const stopsRaw = mergeFeatureCollections(
    city.stopLayers.map((layer) => pointCollection(readJson(path.join(rawBase, `${layer}.geojson`)), layer))
  );
  const stops = clipPointsToBoundary(stopsRaw, boundary);
  const dtp = clipPointsToBoundary(accidentCollection(readJson(path.join(rawBase, "dtp.geojson")), city.dtpAliases), boundary);

  writeJson(path.join(cityOut, "quartals.geojson"), { type: "FeatureCollection", features: quartals });
  writeJson(path.join(cityOut, "buildings.geojson"), { type: "FeatureCollection", features: buildings });
  writeJson(path.join(cityOut, "green.geojson"), readJson(path.join(rawBase, "green.geojson")));
  writeJson(path.join(cityOut, "water.geojson"), readJson(path.join(rawBase, "water.geojson")));
  writeJson(path.join(cityOut, "railways.geojson"), readJson(path.join(rawBase, "railways.geojson")));
  writeJson(path.join(cityOut, "roads.geojson"), readJson(path.join(rawBase, "roads.geojson")));
  writeJson(path.join(cityOut, "roads-all.geojson"), readJson(path.join(rawBase, "roads-all.geojson")));
  writeJson(path.join(cityOut, "stops.geojson"), stops);
  writeJson(path.join(cityOut, "dtp.geojson"), dtp);
  writeJson(path.join(cityOut, "mkd-unmatched.geojson"), { type: "FeatureCollection", features: unmatchedMkd });

  const mkdMatched = buildings.filter((feature) => feature.properties.source === "mkd").length;
  return {
    slug: city.slug,
    name: city.displayName,
    summaryName: city.summaryName,
    populationOverride: city.populationOverride,
    bbox,
    files: {
      quartals: `data/${city.slug}/quartals.geojson`,
      buildings: `data/${city.slug}/buildings.geojson`,
      green: `data/${city.slug}/green.geojson`,
      water: `data/${city.slug}/water.geojson`,
      railways: `data/${city.slug}/railways.geojson`,
      roads: `data/${city.slug}/roads.geojson`,
      roadsAll: `data/${city.slug}/roads-all.geojson`,
      stops: `data/${city.slug}/stops.geojson`,
      dtp: `data/${city.slug}/dtp.geojson`,
      mkdUnmatched: `data/${city.slug}/mkd-unmatched.geojson`
    },
    stats: {
      quartals: quartals.length,
      buildings: buildings.length,
      mkdMatched,
      mkdUnmatched: unmatchedMkd.length,
      stops: stops.features.length,
      dtp: dtp.features.length,
      quarterPopulationSum: Math.round(quarterPopulationSum),
      quarterPopulationSource: populationOptions.authoritative ? "layer" : "fallback",
      quarterPopulationField: populationOptions.authoritative ? populationOptions.fields.join(",") : "city_common_quartals.csv"
    }
  };
}

function enrichManifest(preparedCities) {
  const summaryRows = parseCsv(path.join(rootDir, "city_index", "city_index_summary.csv"));
  const summaries = summaryLookup(summaryRows);
  const cityEntries = preparedCities.map((city, index) => {
    const summary = summaries.get(city.summaryName) ?? {};
    const { populationOverride, ...cityData } = city;
    return {
      ...cityData,
      rank: index + 1,
      index: number(summary.idx_life_100),
      indexNoWork: number(summary.idx_life_no_work_100),
      population: populationOverride ?? number(summary.population_est),
      areaHa: number(summary.area_ha),
      lowShare: number(summary.low_quality_pop_share),
      midShare: number(summary.mid_quality_pop_share),
      highShare: number(summary.high_quality_pop_share),
      blocks: {
        housing: number(summary.idx_housing_100),
        infra: number(summary.idx_infra_100),
        transport: number(summary.idx_transport_100),
        work: number(summary.idx_work_100),
        green: number(summary.idx_green_100)
      }
    };
  });
  cityEntries.sort((a, b) => (b.index ?? 0) - (a.index ?? 0));
  cityEntries.forEach((city, index) => {
    city.rank = index + 1;
  });
  return {
    generatedAt: new Date().toISOString(),
    source: "C:/institute/magic/Diser",
    methodology: {
      baseQuarterFormula: "mean(idx_housing, idx_infra, idx_transport, idx_work, idx_green, idx_commerce)",
      cityFormula: "population-weighted mean of common-normalized quarter scores",
      scenarioFormula: "mean of active subindices in the browser"
    },
    blocks: blockKeys,
    cities: cityEntries
  };
}

function main() {
  for (const city of cities) exportCity(city);
  const populationRows = parseCsv(path.join(rootDir, "city_index", "city_common_quartals.csv"));
  const prepared = cities.map((city) => prepareCity(city, populationRows));
  const manifest = enrichManifest(prepared);
  writeJson(path.join(outDir, "manifest.json"), manifest, true);
  console.log(`Prepared ${prepared.length} cities in ${outDir}`);
}

main();
