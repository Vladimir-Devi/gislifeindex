const BLOCKS = [
  {
    key: "housing",
    label: "Жилье",
    color: "#256d72",
    help: "Обеспеченность жильем и степень износа многоквартирных домов"
  },
  {
    key: "infra",
    label: "Инфраструктура",
    color: "#6f6c2d",
    help: "Коммерческая доступность, её функциональное разнообразие и полнота ежедневной корзины"
  },
  {
    key: "transport",
    label: "Транспорт",
    color: "#316a9c",
    help: "Транспортный субиндекс. Считается по доступности остановок общественного транспорта для квартала"
  },
  {
    key: "work",
    label: "Крупные рабочие места",
    color: "#7b5796",
    help: "Субиндекс рабочих мест. Показывает обеспеченность квартала крыпными работодателями и связанную плотность занятости"
  },
  {
    key: "green",
    label: "Зелёные зоны",
    color: "#477f5b",
    help: "Субиндекс зелёных зон. Основан на доступности зеленых территорий для жителей квартала"
  },
  {
    key: "commerce",
    label: "Экономика",
    color: "#b88624",
    help: "Квартальный субиндекс коммерческой активности по данным ФНС: контрольно-кассовые терминалы, активность и расчетные чековые показатели"
  }
];

const INDICATOR_META = {
  "Жилье|плотность": {
    unit: "чел/га",
    help: "Плотность населения квартала"
  },
  "Жильё|плотность": {
    unit: "чел/га",
    help: "Плотность населения квартала"
  },
  "Жилье|обеспеченность": {
    unit: "м²/чел",
    help: "Обеспеченность жилой площадью на одного жителя"
  },
  "Жильё|обеспеченность": {
    unit: "м²/чел",
    help: "Обеспеченность жилой площадью на одного жителя"
  },
  "Жилье|износ": {
    unit: "%",
    help: "Средневзвешенный износ многоквартирных домов"
  },
  "Жильё|износ": {
    unit: "%",
    help: "Средневзвешенный износ многоквартирных домов"
  },
  "Жилье|этажность": {
    unit: "этажей",
    help: "Средняя этажность многоквартирной жилой застройки"
  },
  "Жильё|этажность": {
    unit: "этажей",
    help: "Средняя этажность многоквартирной жилой застройки"
  },
  "Инфраструктура|разнообразие": {
    unit: "0-1",
    help: "Разнообразие объектов инфраструктуры внутри квартала"
  },
  "Инфраструктура|полнота корзины": {
    unit: "%",
    help: "Доля объектов повседневной корзины, доступной жителям квартала в 5-минутной зоне"
  },
  "Транспорт|доступность": {
    unit: "%",
    help: "Доля населения в 5-минутной доступности от остановок общественного транспорта"
  },
  "Рабочие места|обеспеченность": {
    unit: "коэф.",
    help: "Коэффициент обеспеченности квартала рабочими местами крупных организаций"
  },
  "Рабочие места|плотность": {
    unit: "ед./м²",
    help: "Плотность рабочих мест крупных организаций в пределах квартала"
  },
  "Зеленые зоны|доступность": {
    unit: "%",
    help: "Доля жителей в 5-минутной доступности от зеленых зон"
  },
  "Экономика|активность ФНС": {
    unit: "0-10",
    help: "Оценка коммерческой активности по данным ФНС"
  },
  "Экономика|ККТ": {
    unit: "ед.",
    help: "Число контрольно-кассовой терминалов"
  },
  "Экономика|медианный чек": {
    unit: "руб.",
    help: "Медианный чек коммерческих транзакций"
  }
};

const GROUP_HELP = {
  "Жилье": BLOCKS.find((block) => block.key === "housing").help,
  "Жильё": BLOCKS.find((block) => block.key === "housing").help,
  "Инфраструктура": BLOCKS.find((block) => block.key === "infra").help,
  "Транспорт": BLOCKS.find((block) => block.key === "transport").help,
  "Рабочие места": BLOCKS.find((block) => block.key === "work").help,
  "Зеленые зоны": BLOCKS.find((block) => block.key === "green").help,
  "Коммерция": BLOCKS.find((block) => block.key === "commerce").help
};

const LAYERS = [
  { key: "quartals", label: "Кварталы" },
  { key: "buildings", label: "Здания" },
  { key: "green", label: "Зеленые зоны" },
  { key: "roads", label: "Улично дорожная сеть" },
  { key: "stops", label: "Остановки" },
  { key: "dtp", label: "ДТП" }
];

const state = {
  manifest: null,
  activeCity: null,
  geo: null,
  activeBlocks: new Set(BLOCKS.map((block) => block.key)),
  layers: {
    quartals: true,
    buildings: true,
    green: true,
    roads: true,
    stops: false,
    dtp: false
  },
  camera: {
    scale: 0.045,
    fitScale: 0.045,
    panX: 0,
    panY: 0,
    rot: -0.66,
    pitch: 0.58
  },
  selected: null,
  accidentPopup: null,
  dragging: null,
  pulseFrame: null
};

const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d", { alpha: false });
const els = {
  title: document.getElementById("pageTitle"),
  topMetric: document.getElementById("topMetric"),
  cityMenu: document.getElementById("cityMenu"),
  mapShell: document.getElementById("mapShell"),
  backButton: document.getElementById("backButton"),
  scenarioControls: document.getElementById("scenarioControls"),
  layerControls: document.getElementById("layerControls"),
  infoPanel: document.getElementById("infoPanel"),
  legend: document.getElementById("legend"),
  symbolLegend: document.getElementById("symbolLegend"),
  accidentPopup: document.getElementById("accidentPopup")
};

init();

async function init() {
  state.manifest = await fetchJson("data/manifest.json");
  renderCityMenu();
  renderControls();
  renderLegend();
  attachEvents();
  resizeCanvas();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Не удалось загрузить ${url}`);
  return response.json();
}

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

function formatInt(value) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

function percent(value) {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value * 100, 1)}%`;
}

function renderCityMenu() {
  const cities = state.manifest.cities;
  els.cityMenu.innerHTML = cities
    .map(
      (city) => `
        <article class="cityCard" data-city="${city.slug}">
          <div class="cityCardTop">
            <h2 class="cityName">${city.name}</h2>
            <div class="cityRating">
              <strong>${formatNumber(city.index, 2)}</strong>
              <span>место ${city.rank}</span>
            </div>
          </div>
          <div class="crestSlot">
            <img src="public/herb_${city.slug}.png" alt="Герб ${city.name}" loading="lazy">
          </div>
          <dl class="cityFacts">
            <div><dt>Жители</dt><dd>${formatInt(city.population)}</dd></div>
            <div><dt>Кварталы</dt><dd>${formatInt(city.stats.quartals)}</dd></div>
            <div><dt>Хорошие кварталы</dt><dd>${percent(city.highShare)}</dd></div>
            <div><dt>Средние кварталы</dt><dd>${percent(city.midShare)}</dd></div>
            <div><dt>Плохие кварталы</dt><dd>${percent(city.lowShare)}</dd></div>
          </dl>
        </article>`
    )
    .join("");

  for (const card of els.cityMenu.querySelectorAll(".cityCard")) {
    card.addEventListener("click", () => loadCity(card.dataset.city));
  }
}

function renderControls() {
  els.scenarioControls.innerHTML = BLOCKS.map(
    (block) => `
      <label class="toggle">
        <input type="checkbox" data-block="${block.key}" checked />
        ${block.label}
      </label>`
  ).join("");

  els.layerControls.innerHTML = LAYERS.map(
    (layer) => `
      <label class="toggle">
        <input type="checkbox" data-layer="${layer.key}" ${state.layers[layer.key] ? "checked" : ""} />
        ${layer.label}
      </label>`
  ).join("");

  els.scenarioControls.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-block]");
    if (!input) return;
    if (input.checked) state.activeBlocks.add(input.dataset.block);
    else state.activeBlocks.delete(input.dataset.block);
    recomputeScores();
    updatePanel();
    draw();
  });

  els.layerControls.addEventListener("change", (event) => {
    const input = event.target.closest("input[data-layer]");
    if (!input) return;
    state.layers[input.dataset.layer] = input.checked;
    if (input.dataset.layer === "dtp" && !input.checked) state.accidentPopup = null;
    renderSymbolLegend();
    draw();
  });
}

function renderLegend() {
  els.legend.innerHTML = `
    <div class="legendTitle">Сценарный индекс квартала</div>
    <div class="legendGradient"></div>
    <div class="legendScale"><span>0</span><span>50</span><span>100</span></div>
  `;
  renderSymbolLegend();
}

function renderSymbolLegend() {
  const rows = [];
  if (state.layers.stops) {
    rows.push(`<span><i class="dot bus"></i>Автобусная остановка</span>`);
    rows.push(`<span><i class="dot tram"></i>Трамвайная остановка</span>`);
  }
  if (state.layers.dtp) {
    rows.push(`<span><i class="dot crash small"></i><i class="dot crash big"></i>ДТП по пострадавшим</span>`);
  }
  if (!rows.length) {
    els.symbolLegend.classList.add("hidden");
    els.symbolLegend.innerHTML = "";
    return;
  }
  els.symbolLegend.classList.remove("hidden");
  els.symbolLegend.innerHTML = `<div class="legendSymbols">${rows.join("")}</div>`;
}

function attachEvents() {
  els.backButton.addEventListener("click", showCityMenu);
  document.getElementById("rotateLeft").addEventListener("click", () => rotateBy(-0.18));
  document.getElementById("rotateRight").addEventListener("click", () => rotateBy(0.18));
  document.getElementById("resetView").addEventListener("click", resetView);
  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("dragging");
    state.dragging = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: state.camera.panX,
      panY: state.camera.panY,
      moved: false
    };
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragging) return;
    const dx = event.clientX - state.dragging.x;
    const dy = event.clientY - state.dragging.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) state.dragging.moved = true;
    state.camera.panX = state.dragging.panX + dx;
    state.camera.panY = state.dragging.panY + dy;
    draw();
  });

  canvas.addEventListener("pointerup", (event) => {
    const drag = state.dragging;
    state.dragging = null;
    canvas.classList.remove("dragging");
    if (!drag?.moved) pickQuarter(event);
  });

  canvas.addEventListener(
    "wheel",
    (event) => {
      if (!state.geo) return;
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cursor = [event.clientX - rect.left, event.clientY - rect.top];
      const world = screenToWorld(cursor[0], cursor[1]);
      const factor = event.deltaY < 0 ? 1.16 : 0.86;
      state.camera.scale = clamp(state.camera.scale * factor, state.camera.fitScale * 0.62, state.camera.fitScale * 12);
      const after = worldToScreen(world[0], world[1], 0);
      state.camera.panX += cursor[0] - after[0];
      state.camera.panY += cursor[1] - after[1];
      draw();
    },
    { passive: false }
  );
}

async function loadCity(slug) {
  const city = state.manifest.cities.find((item) => item.slug === slug);
  if (!city) return;
  stopPulse();
  state.activeCity = city;
  state.selected = null;
  state.accidentPopup = null;
  els.title.textContent = city.name;
  els.topMetric.textContent = `Индекс ${formatNumber(city.index, 2)} · ${formatInt(city.population)} жителей`;
  els.cityMenu.classList.add("hidden");
  els.mapShell.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  els.infoPanel.innerHTML = `<div class="muted">Загрузка данных</div>`;

  const [quartals, buildings, green, roads, roadsAll, stops, dtp, mkdUnmatched] = await Promise.all([
    fetchJson(city.files.quartals),
    fetchJson(city.files.buildings),
    fetchJson(city.files.green),
    fetchJson(city.files.roads),
    fetchJson(city.files.roadsAll),
    fetchJson(city.files.stops),
    fetchJson(city.files.dtp),
    fetchJson(city.files.mkdUnmatched)
  ]);

  const center = [(city.bbox[0] + city.bbox[2]) / 2, (city.bbox[1] + city.bbox[3]) / 2];
  const projection = makeProjection(center);
  state.geo = {
    center,
    projection,
    quartals: preparePolygons(quartals, projection),
    buildings: preparePolygons(buildings, projection),
    green: preparePolygons(green, projection),
    roads: prepareLines(roads, projection),
    roadsAll: prepareLines(roadsAll, projection),
    stops: preparePoints(stops, projection),
    dtp: preparePoints(dtp, projection),
    mkdUnmatched: preparePoints(mkdUnmatched, projection),
    bbox: projectBbox(city.bbox, projection)
  };

  resizeCanvas();
  resetView();
  recomputeScores();
  updatePanel();
  draw();
}

function showCityMenu() {
  stopPulse();
  state.activeCity = null;
  state.geo = null;
  state.selected = null;
  state.accidentPopup = null;
  hideAccidentPopup();
  els.title.textContent = "Города исследования";
  els.topMetric.textContent = "";
  els.mapShell.classList.add("hidden");
  els.backButton.classList.add("hidden");
  els.cityMenu.classList.remove("hidden");
}

function makeProjection([centerLon, centerLat]) {
  const metersPerLat = 111320;
  const metersPerLon = Math.cos((centerLat * Math.PI) / 180) * 111320;
  return ([lon, lat]) => [(lon - centerLon) * metersPerLon, (lat - centerLat) * metersPerLat];
}

function projectBbox(bbox, projection) {
  const corners = [
    projection([bbox[0], bbox[1]]),
    projection([bbox[2], bbox[1]]),
    projection([bbox[2], bbox[3]]),
    projection([bbox[0], bbox[3]])
  ];
  return bboxFromPoints(corners);
}

function preparePolygons(collection, projection) {
  return collection.features
    .map((feature, index) => {
      const polygons = geometryToPolygons(feature.geometry, projection);
      if (!polygons.length) return null;
      const points = polygons.flat(2);
      const bbox = bboxFromPoints(points);
      return {
        id: String(feature.id ?? feature.properties?.id ?? index + 1),
        properties: feature.properties ?? {},
        polygons,
        bbox,
        center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
        depth: 0
      };
    })
    .filter(Boolean);
}

function prepareLines(collection, projection) {
  return collection.features
    .map((feature) => geometryToLines(feature.geometry, projection))
    .flat()
    .filter((line) => line.length > 1)
    .map((line) => ({ line, bbox: bboxFromPoints(line) }));
}

function preparePoints(collection, projection) {
  return collection.features
    .filter((feature) => feature.geometry?.type === "Point")
    .map((feature) => ({
      point: projection(feature.geometry.coordinates),
      properties: feature.properties ?? {}
    }));
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
  return [minX, minY, maxX, maxY];
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (state.geo) draw();
}

function resetView() {
  if (!state.geo) return;
  state.camera.rot = -0.66;
  state.camera.pitch = 0.58;
  const rect = canvas.getBoundingClientRect();
  const extent = projectedScreenExtent(state.geo.bbox, 1);
  const usableWidth = Math.max(320, rect.width - 420);
  const usableHeight = Math.max(320, rect.height - 80);
  const scale = Math.min(usableWidth / extent.width, usableHeight / extent.height) * 0.82;
  state.camera.scale = scale;
  state.camera.fitScale = scale;
  state.camera.panX = rect.width > 900 ? -170 : 0;
  state.camera.panY = 18;
  draw();
}

function rotateBy(delta) {
  state.camera.rot += delta;
  draw();
}

function projectedScreenExtent(bbox, scale) {
  const corners = [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[1]],
    [bbox[2], bbox[3]],
    [bbox[0], bbox[3]]
  ].map(([x, y]) => rawScreen(x, y, 0, scale));
  const box = bboxFromPoints(corners);
  return { width: box[2] - box[0], height: box[3] - box[1] };
}

function rawScreen(x, y, z = 0, scale = state.camera.scale) {
  const cos = Math.cos(state.camera.rot);
  const sin = Math.sin(state.camera.rot);
  const rx = x * cos - y * sin;
  const ry = x * sin + y * cos;
  return [rx * scale, -(ry * state.camera.pitch + z) * scale];
}

function worldToScreen(x, y, z = 0) {
  const rect = canvas.getBoundingClientRect();
  const [sx, sy] = rawScreen(x, y, z);
  return [rect.width / 2 + state.camera.panX + sx, rect.height / 2 + state.camera.panY + sy];
}

function screenToWorld(sx, sy) {
  const rect = canvas.getBoundingClientRect();
  const rx = (sx - rect.width / 2 - state.camera.panX) / state.camera.scale;
  const ry = -((sy - rect.height / 2 - state.camera.panY) / state.camera.scale) / state.camera.pitch;
  const cos = Math.cos(state.camera.rot);
  const sin = Math.sin(state.camera.rot);
  return [rx * cos + ry * sin, -rx * sin + ry * cos];
}

function recomputeScores() {
  if (!state.geo) return;
  const active = [...state.activeBlocks];
  for (const feature of state.geo.quartals) {
    const values = active
      .map((key) => feature.properties.blocks?.[key])
      .filter((value) => Number.isFinite(value));
    feature.properties.currentScore = values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length) * 100 : null;
  }
  const ranked = state.geo.quartals
    .filter((feature) => Number.isFinite(feature.properties.currentScore))
    .sort((a, b) => b.properties.currentScore - a.properties.currentScore);
  ranked.forEach((feature, index) => {
    feature.properties.currentRank = index + 1;
  });
}

function cityScenarioScore() {
  if (!state.geo) return null;
  let weighted = 0;
  let total = 0;
  for (const feature of state.geo.quartals) {
    const score = feature.properties.currentScore;
    const weight = feature.properties.population;
    if (!Number.isFinite(score) || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += score * weight;
    total += weight;
  }
  return total > 0 ? weighted / total : null;
}

function cityBlockScores() {
  if (!state.geo) return {};
  const result = {};
  for (const block of BLOCKS) {
    let weighted = 0;
    let total = 0;
    for (const feature of state.geo.quartals) {
      const value = feature.properties.blocks?.[block.key];
      const weight = feature.properties.population;
      if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) continue;
      weighted += value * 100 * weight;
      total += weight;
    }
    result[block.key] = total > 0 ? weighted / total : null;
  }
  return result;
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "#e7e0d3";
  ctx.fillRect(0, 0, rect.width, rect.height);
  if (!state.geo) return;

  drawGrid(rect);
  if (state.layers.green) drawPolygonLayer(state.geo.green, "rgba(80, 130, 78, 0.34)", "rgba(61, 92, 58, 0.22)", 0);
  if (state.layers.quartals) drawQuartals();
  if (state.layers.roads) drawRoads();
  if (state.layers.buildings) drawBuildings();
  if (state.layers.stops) drawStops();
  if (state.layers.dtp) drawAccidents();
  drawSelected();
  renderAccidentPopup();
}

function drawGrid(rect) {
  ctx.save();
  ctx.strokeStyle = "rgba(94, 91, 84, 0.09)";
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = ((state.camera.panX % step) + step) % step; x < rect.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = ((state.camera.panY % step) + step) % step; y < rect.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawQuartals() {
  const sorted = [...state.geo.quartals].sort((a, b) => depthOf(a) - depthOf(b));
  for (const feature of sorted) {
    const score = feature.properties.currentScore ?? feature.properties.baseScore;
    const color = scoreColor(score, 0.84);
    drawPath(feature.polygons, 0);
    ctx.fillStyle = color;
    ctx.fill("evenodd");
    ctx.strokeStyle = "#5f625d";
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }
}

function drawRoads() {
  const view = worldViewBbox();
  ctx.save();
  if (state.camera.scale >= state.camera.fitScale * 3.4) {
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "rgba(91, 96, 96, 0.36)";
    drawLineCollection(state.geo.roadsAll, view, 4);
  }
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = "rgba(47, 54, 55, 0.58)";
  drawLineCollection(state.geo.roads, view, 6);
  ctx.restore();
}

function drawLineCollection(lines, view, z) {
  for (const item of lines) {
    if (!bboxIntersects(item.bbox, view)) continue;
    ctx.beginPath();
    item.line.forEach(([x, y], index) => {
      const [sx, sy] = worldToScreen(x, y, z);
      if (index === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();
  }
}

function drawBuildings() {
  const view = worldViewBbox();
  const dense = state.camera.scale < state.camera.fitScale * 1.9;
  const sorted = state.geo.buildings
    .filter((feature) => bboxIntersects(feature.bbox, view))
    .filter((feature) => !dense || feature.properties.source === "mkd" || feature.properties.area > 130)
    .sort((a, b) => depthOf(a) - depthOf(b));

  const maxDraw = dense ? 14000 : 36000;
  for (const feature of sorted.slice(0, maxDraw)) {
    const isMkd = feature.properties.source === "mkd";
    const fill = isMkd ? "rgba(141, 136, 125, 0.88)" : "rgba(120, 117, 110, 0.84)";
    drawExtruded(feature, feature.properties.height, fill, "rgba(63, 60, 55, 0.7)", "rgba(94, 90, 82, 0.62)");
  }

  if (state.camera.scale >= state.camera.fitScale * 2.2) {
    drawPoints(state.geo.mkdUnmatched, "#b88624", 2.4);
  }
}

function drawPolygonLayer(features, fill, stroke, z = 0) {
  const view = worldViewBbox();
  for (const feature of features) {
    if (!bboxIntersects(feature.bbox, view)) continue;
    drawPath(feature.polygons, z);
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

function drawPoints(points, color, radius) {
  const view = worldViewBbox();
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1;
  for (const item of points) {
    const [x, y] = item.point;
    if (x < view[0] || x > view[2] || y < view[1] || y > view[3]) continue;
    const [sx, sy] = worldToScreen(x, y, 10);
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawStops() {
  const view = worldViewBbox();
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (const item of state.geo.stops) {
    const [x, y] = item.point;
    if (x < view[0] || x > view[2] || y < view[1] || y > view[3]) continue;
    const [sx, sy] = worldToScreen(x, y, 12);
    const isTram = item.properties.source === "tram_stop";
    ctx.fillStyle = isTram ? "#b64c3f" : "#316a9c";
    ctx.beginPath();
    if (isTram) {
      ctx.rect(sx - 3.4, sy - 3.4, 6.8, 6.8);
    } else {
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawAccidents() {
  const view = worldViewBbox();
  ctx.save();
  ctx.fillStyle = "#b64c3f";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (const item of state.geo.dtp) {
    const [x, y] = item.point;
    if (x < view[0] || x > view[2] || y < view[1] || y > view[3]) continue;
    const radius = accidentRadius(item);
    const [sx, sy] = worldToScreen(x, y, 14);
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function accidentRadius(item) {
  const severity = item.properties.severity ?? item.properties.injured ?? 1;
  return clamp(2.8 + Math.sqrt(Math.max(severity, 1)) * 2.2, 3.5, 13);
}

function drawExtruded(feature, height, fill, stroke, sideFill) {
  for (const polygon of feature.polygons) {
    const outer = polygon[0];
    if (!outer || outer.length < 3) continue;
    ctx.fillStyle = sideFill;
    for (let i = 0; i < outer.length - 1; i += 1) {
      const a = outer[i];
      const b = outer[i + 1];
      const ab = worldToScreen(a[0], a[1], 0);
      const bb = worldToScreen(b[0], b[1], 0);
      const bt = worldToScreen(b[0], b[1], height);
      const at = worldToScreen(a[0], a[1], height);
      ctx.beginPath();
      ctx.moveTo(ab[0], ab[1]);
      ctx.lineTo(bb[0], bb[1]);
      ctx.lineTo(bt[0], bt[1]);
      ctx.lineTo(at[0], at[1]);
      ctx.closePath();
      ctx.fill();
    }
    drawPath([polygon], height);
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
}

function drawPath(polygons, z) {
  ctx.beginPath();
  for (const polygon of polygons) {
    for (const ring of polygon) {
      ring.forEach(([x, y], index) => {
        const [sx, sy] = worldToScreen(x, y, z);
        if (index === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
    }
  }
}

function drawSelected() {
  if (!state.selected) return;
  const phase = performance.now() / 1450;
  const z = 10 + (Math.sin(phase) + 1) * 7;
  drawPath(state.selected.polygons, z);
  ctx.fillStyle = "rgba(255, 246, 199, 0.18)";
  ctx.fill("evenodd");
  ctx.strokeStyle = "rgba(30, 37, 40, 0.42)";
  ctx.lineWidth = 6;
  ctx.stroke();
  drawPath(state.selected.polygons, z);
  ctx.strokeStyle = "#1e2528";
  ctx.lineWidth = 2.4;
  ctx.stroke();
}

function scoreColor(score, alpha = 1) {
  const stops = [
    [0, [168, 61, 75]],
    [35, [217, 120, 66]],
    [55, [223, 189, 84]],
    [72, [118, 173, 112]],
    [100, [45, 123, 120]]
  ];
  const value = clamp(score ?? 0, 0, 100);
  let left = stops[0];
  let right = stops.at(-1);
  for (let i = 1; i < stops.length; i += 1) {
    if (value <= stops[i][0]) {
      left = stops[i - 1];
      right = stops[i];
      break;
    }
  }
  const t = (value - left[0]) / (right[0] - left[0] || 1);
  const rgb = left[1].map((channel, index) => Math.round(channel + (right[1][index] - channel) * t));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function worldViewBbox() {
  const rect = canvas.getBoundingClientRect();
  const points = [
    screenToWorld(-80, -80),
    screenToWorld(rect.width + 80, -80),
    screenToWorld(rect.width + 80, rect.height + 80),
    screenToWorld(-80, rect.height + 80)
  ];
  return bboxFromPoints(points);
}

function bboxIntersects(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function depthOf(feature) {
  const sin = Math.sin(state.camera.rot);
  const cos = Math.cos(state.camera.rot);
  return feature.center[0] * sin + feature.center[1] * cos;
}

function pickQuarter(event) {
  if (!state.geo) return;
  const rect = canvas.getBoundingClientRect();
  const screen = [event.clientX - rect.left, event.clientY - rect.top];
  const accident = pickAccident(screen[0], screen[1]);
  if (accident) {
    state.accidentPopup = accident;
    state.selected = null;
    stopPulse();
    updatePanel();
    draw();
    return;
  }
  state.accidentPopup = null;
  const world = screenToWorld(screen[0], screen[1]);
  const hit = [...state.geo.quartals]
    .sort((a, b) => depthOf(b) - depthOf(a))
    .find((feature) => pointInFeature(feature, world));
  state.selected = hit ?? null;
  if (state.selected) startPulse();
  else stopPulse();
  updatePanel();
  draw();
}

function pickAccident(screenX, screenY) {
  if (!state.layers.dtp || !state.geo?.dtp?.length) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const item of state.geo.dtp) {
    const [x, y] = item.point;
    const [sx, sy] = worldToScreen(x, y, 14);
    const radius = accidentRadius(item) + 5;
    const distance = Math.hypot(screenX - sx, screenY - sy);
    if (distance <= radius && distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  }
  return best;
}

function startPulse() {
  if (state.pulseFrame) return;
  const tick = () => {
    if (!state.selected) {
      state.pulseFrame = null;
      return;
    }
    draw();
    state.pulseFrame = requestAnimationFrame(tick);
  };
  state.pulseFrame = requestAnimationFrame(tick);
}

function stopPulse() {
  if (state.pulseFrame) cancelAnimationFrame(state.pulseFrame);
  state.pulseFrame = null;
}

function renderAccidentPopup() {
  if (!state.accidentPopup || !state.layers.dtp) {
    hideAccidentPopup();
    return;
  }
  const item = state.accidentPopup;
  const [sx, sy] = worldToScreen(item.point[0], item.point[1], 28);
  const props = item.properties;
  const when = [props.date, props.time].filter(Boolean).join(" ");
  els.accidentPopup.classList.remove("hidden");
  els.accidentPopup.style.left = `${sx}px`;
  els.accidentPopup.style.top = `${sy}px`;
  els.accidentPopup.innerHTML = `
    <strong>${props.type || "ДТП"}</strong>
    <span>${when || "Дата не указана"}</span>
    <span>Пострадавшие: ${formatInt(props.injured ?? 0)}</span>
    <span>Погибшие: ${formatInt(props.dead ?? 0)}</span>
    ${props.address ? `<small>${props.address}</small>` : ""}
  `;
}

function hideAccidentPopup() {
  els.accidentPopup.classList.add("hidden");
  els.accidentPopup.innerHTML = "";
}

function pointInFeature(feature, [x, y]) {
  if (x < feature.bbox[0] || x > feature.bbox[2] || y < feature.bbox[1] || y > feature.bbox[3]) return false;
  return feature.polygons.some((polygon) => polygonContainsPoint(polygon, x, y));
}

function polygonContainsPoint(polygon, x, y) {
  if (!ringContainsPoint(polygon[0], x, y)) return false;
  for (let i = 1; i < polygon.length; i += 1) {
    if (ringContainsPoint(polygon[i], x, y)) return false;
  }
  return true;
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

function updatePanel() {
  if (!state.activeCity || !state.geo) return;
  const cityScore = cityScenarioScore();
  els.topMetric.textContent = `Сценарный индекс ${formatNumber(cityScore, 2)} · Основной индекс ${formatNumber(state.activeCity.index, 2)}`;
  els.infoPanel.innerHTML = state.selected ? renderQuarterPanel(state.selected) : renderCityPanel(cityScore);
}

function renderCityPanel(cityScore) {
  const city = state.activeCity;
  return `
    <div class="panelTitle">
      <h2>${city.name}</h2>
      <span class="muted">#${city.rank}</span>
    </div>
    <div class="metricGrid">
      <div class="metric"><strong>${formatNumber(cityScore, 2)}</strong><span>Сценарный индекс</span></div>
      <div class="metric"><strong>${formatNumber(city.index, 2)}</strong><span>Основной индекс</span></div>
      <div class="metric"><strong>${formatInt(city.stats.quartals)}</strong><span>Кварталы</span></div>
      <div class="metric"><strong>${formatInt(city.stats.buildings)}</strong><span>Строения</span></div>
    </div>
    ${renderBars(cityBlockScores())}
  `;
}

function renderQuarterPanel(feature) {
  const props = feature.properties;
  return `
    <div class="panelTitle">
      <h2>Квартал ${props.id}</h2>
      <span class="muted">#${props.currentRank ?? "—"}</span>
    </div>
    <div class="metricGrid">
      <div class="metric"><strong>${formatNumber(props.currentScore, 2)}</strong><span>Сценарный индекс</span></div>
      <div class="metric"><strong>${formatNumber(props.baseScore, 2)}</strong><span>Основной индекс</span></div>
      <div class="metric"><strong>${formatNumber(props.baseRank, 0)}</strong><span>Ранг</span></div>
      <div class="metric"><strong>${formatInt(props.population)}</strong><span>Численность население</span></div>
    </div>
    ${renderBars(Object.fromEntries(BLOCKS.map((block) => [block.key, (props.blocks?.[block.key] ?? null) * 100])))}
    ${renderGroupedIndicators(props.indicators)}
  `;
}

function renderGroupedIndicators(indicators) {
  const groups = new Map();
  for (const item of indicators) {
    const parts = item.label.split(":").map((part) => part.trim());
    const group = parts.length > 1 ? parts[0] : "Показатели";
    const label = parts.length > 1 ? parts[1] : parts[0];
    const meta = indicatorMeta(group, label);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value: item.value,
      unit: meta.unit,
      help: meta.help
    });
  }
  return `
    <div class="indicatorList">
      ${[...groups.entries()]
        .map(
          ([group, items]) => `
            <section class="indicatorGroup">
              <h3 title="${escapeAttr(GROUP_HELP[group] ?? "")}">${group}</h3>
              ${items
                .map(
                  (item) => `
                    <div class="indicator" title="${escapeAttr(item.help)}">
                      <span>${item.label}</span>
                      <em>${item.unit}</em>
                      <strong>${formatNumber(item.value, 2)}</strong>
                    </div>`
                )
                .join("")}
            </section>`
        )
        .join("")}
    </div>
  `;
}

function renderBars(values) {
  return `
    <div class="barList">
      ${BLOCKS.map((block) => {
        const value = values?.[block.key];
        const normalized = Number.isFinite(value) ? clamp(value, 0, 100) : 0;
        return `
          <div class="barRow" title="${escapeAttr(block.help)}">
            <span class="helpText">${block.label}</span>
            <div class="barTrack"><div class="barFill" style="width:${normalized}%; background:${block.color}"></div></div>
            <strong>${formatNumber(value, 0)}</strong>
          </div>`;
      }).join("")}
    </div>
  `;
}

function indicatorMeta(group, label) {
  const variants = [
    `${group}|${label.toLowerCase()}`,
    `${group.replace(/ё/g, "е").replace(/Ё/g, "Е")}|${label.toLowerCase().replace(/ё/g, "е")}`
  ];
  for (const key of variants) {
    if (INDICATOR_META[key]) return INDICATOR_META[key];
  }
  return {
    unit: "ед.",
    help: "Исходный показатель квартала, используемый при нормализации и расчете соответствующего субиндекса."
  };
}

function escapeAttr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
