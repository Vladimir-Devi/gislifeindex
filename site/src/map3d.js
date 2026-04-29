const BLOCKS = [
  {
    key: "housing",
    label: "Жильё",
    color: "#256d72",
    help: "Субиндекс жилья: обеспеченность жильём, плотность, этажность и износ жилого фонда."
  },
  {
    key: "infra",
    label: "Инфраструктура",
    color: "#6f6c2d",
    help: "Субиндекс социальной и повседневной инфраструктуры: разнообразие и полнота городской корзины."
  },
  {
    key: "transport",
    label: "Транспорт",
    color: "#316a9c",
    help: "Субиндекс транспорта: доступность остановок общественного транспорта для жителей квартала."
  },
  {
    key: "work",
    label: "Крупные рабочие места",
    color: "#7b5796",
    help: "Субиндекс рабочих мест: обеспеченность квартала крупными работодателями и плотность занятости."
  },
  {
    key: "green",
    label: "Зелёные зоны",
    color: "#477f5b",
    help: "Субиндекс зелёных зон: доступность зелёных территорий для жителей квартала."
  },
  {
    key: "commerce",
    label: "Коммерция",
    color: "#b88624",
    help: "Субиндекс коммерческой активности по данным ФНС: ККТ, активность и чековые показатели."
  }
];

const LAYERS = [
  { key: "quartals", label: "Кварталы" },
  { key: "buildings", label: "Здания" },
  { key: "stops", label: "Остановки" },
  { key: "dtp", label: "ДТП" }
];

const INDICATOR_META = {
  "Жильё|плотность": { unit: "чел/га", help: "Плотность населения квартала." },
  "Жильё|обеспеченность": { unit: "м²/чел", help: "Обеспеченность жилой площадью на одного жителя." },
  "Жильё|износ": { unit: "%", help: "Средневзвешенный износ многоквартирного жилищного фонда." },
  "Жильё|этажность": { unit: "этажей", help: "Средняя этажность многоквартирной жилой застройки." },
  "Инфраструктура|разнообразие": { unit: "0-1", help: "Разнообразие объектов инфраструктуры внутри квартала." },
  "Инфраструктура|полнота корзины": { unit: "%", help: "Доля базовой городской корзины, доступной жителям квартала." },
  "Транспорт|доступность": { unit: "%", help: "Доля населения квартала в зоне доступности остановок." },
  "Рабочие места|обеспеченность": { unit: "коэф.", help: "Коэффициент обеспеченности квартала рабочими местами." },
  "Рабочие места|плотность": { unit: "ед./м²", help: "Плотность рабочих мест крупных организаций." },
  "Зелёные зоны|доступность": { unit: "%", help: "Доля жителей квартала в зоне доступности зелёных зон." },
  "Коммерция|активность ФНС": { unit: "0-10", help: "Оценка коммерческой активности по данным ФНС." },
  "Коммерция|ККТ": { unit: "ед.", help: "Число единиц контрольно-кассовой техники." },
  "Коммерция|медианный чек": { unit: "руб.", help: "Медианный чек коммерческих операций." }
};

const GROUP_HELP = {
  "Жильё": BLOCKS.find((block) => block.key === "housing").help,
  "Инфраструктура": BLOCKS.find((block) => block.key === "infra").help,
  "Транспорт": BLOCKS.find((block) => block.key === "transport").help,
  "Рабочие места": BLOCKS.find((block) => block.key === "work").help,
  "Зелёные зоны": BLOCKS.find((block) => block.key === "green").help,
  "Коммерция": BLOCKS.find((block) => block.key === "commerce").help
};

const DETAIL_FACTOR = 4.75;
const ROAD_DETAIL_FACTOR = 4.2;
const BUILDING_FADE_FACTOR = 5.35;
const FLOATS_PER_VERTEX = 7;
const HEIGHT_EXAGGERATION = 1.33;
const NON_MKD_HEIGHT_FACTOR = 0.32;
const DATA_VERSION = "20260430-0200";

const state = {
  manifest: null,
  activeCity: null,
  data: null,
  activeBlocks: new Set(BLOCKS.map((block) => block.key)),
  layers: {
    quartals: true,
    buildings: true,
    stops: false,
    dtp: false
  },
  camera: {
    scale: 0.045,
    fitScale: 0.045,
    center: [0, 0],
    bearing: -0.66,
    pitch: 0.82
  },
  selected: null,
  accidentPopup: null,
  accidentDisplayItems: [],
  cameraAnimation: null,
  dragging: null,
  pulseFrame: null,
  overviewMesh: null,
  tileMeshes: new Map(),
  tileBuildingFeatures: new Map(),
  roadTiles: new Map(),
  loadingTiles: new Set(),
  requestedTiles: new Set(),
  panelValues: null,
  sheetDrag: null,
  activePointers: new Map(),
  pinchGesture: null,
  suppressHandleClickUntil: 0,
  renderToken: 0
};

const baseCanvas = document.getElementById("baseCanvas");
const overlayCanvas = document.getElementById("overlayCanvas");
const glCanvas = document.getElementById("glCanvas");
const baseCtx = baseCanvas.getContext("2d");
const overlayCtx = overlayCanvas.getContext("2d");
let gl = null;
try {
  gl = glCanvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
    premultipliedAlpha: false
  });
} catch (error) {
  console.error(error);
}

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

let glState = null;

// @dist-split
async function init() {
  state.manifest = fallbackManifest();
  renderCityMenu();
  renderControls();
  renderLegend();
  attachEvents();
  resizeCanvases();
  if (!gl) {
    els.infoPanel.innerHTML = `<div class="muted">WebGL недоступен</div>`;
  }
  loadManifest()
    .then((manifest) => {
      state.manifest = manifest;
      if (!state.activeCity) renderCityMenu();
    })
    .catch((error) => {
      console.error(error);
    });
}

function fallbackManifest() {
  const tileKeys = allTileKeys(8);
  return {
    generatedAt: "fallback",
    tileCount: 8,
    cities: [
      {
        slug: "orel",
        name: "Орёл",
        rank: 1,
        index: 50.15066088619108,
        population: 285487.66757751553,
        highShare: 0.13397297158400465,
        stats: { quartals: 344 },
        stats3d: { buildings: 22422, buildingsOverview: 3804 },
        projectedBbox: [-6069.5, -6570.5, 6069.5, 6570.5],
        tileCount: 8,
        files3d: {
          quartals: "data3d/orel/quartals.json",
          green: "data3d/orel/green.json",
          water: "data3d/orel/water.json",
          roads: "data3d/orel/roads.json",
          railways: "data3d/orel/railways.json",
          points: "data3d/orel/points.json",
          buildingsOverview: "data3d/orel/buildings-overview.json",
          buildingsTileBase: "data3d/orel/buildings",
          roadsAllTileBase: "data3d/orel/roads-all"
        },
        tiles3d: {
          buildings: tileKeys,
          roadsAll: tileKeys
        }
      },
      {
        slug: "tambov",
        name: "Тамбов",
        rank: 2,
        index: 48.23832436250186,
        population: 250331.00001539226,
        highShare: 0.013464405380248049,
        stats: { quartals: 391 },
        stats3d: { buildings: 50988, buildingsOverview: 2014 },
        projectedBbox: [-5195.7, -6736.4, 5195.7, 6736.4],
        tileCount: 8,
        files3d: {
          quartals: "data3d/tambov/quartals.json",
          green: "data3d/tambov/green.json",
          water: "data3d/tambov/water.json",
          roads: "data3d/tambov/roads.json",
          railways: "data3d/tambov/railways.json",
          points: "data3d/tambov/points.json",
          buildingsOverview: "data3d/tambov/buildings-overview.json",
          buildingsTileBase: "data3d/tambov/buildings",
          roadsAllTileBase: "data3d/tambov/roads-all"
        },
        tiles3d: {
          buildings: tileKeys,
          roadsAll: tileKeys
        }
      }
    ]
  };
}

function allTileKeys(count) {
  const keys = [];
  for (let x = 0; x < count; x += 1) {
    for (let y = 0; y < count; y += 1) keys.push(`${x}-${y}`);
  }
  return keys;
}

async function loadManifest() {
  const candidates = [
    `data3d/manifest.json?v=${DATA_VERSION}`,
    `/data3d/manifest.json?v=${DATA_VERSION}`,
    "data3d/manifest.json",
    "/data3d/manifest.json"
  ];
  let lastError = null;
  for (const url of candidates) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Не удалось загрузить ${url}`);
  return response.json();
}

function decodeBuildings(payload) {
  if (payload && Array.isArray(payload.features)) return payload.features;
  if (!payload || payload.f !== "b1" || !Array.isArray(payload.b)) return [];
  const scale = payload.s || 10;
  return payload.b
    .map((item) => decodeBuilding(item, scale))
    .filter(Boolean);
}

function decodeBuilding(item, scale) {
  if (!Array.isArray(item) || item.length < 4) return null;
  const polygons = [];
  for (let i = 3; i < item.length; i += 1) {
    const ring = decodeBuildingRing(item[i], scale);
    if (ring.length >= 3) polygons.push([ring]);
  }
  if (!polygons.length) return null;
  return {
    bbox: bboxFromPoints(polygons.flat(2)),
    polygons,
    h: item[0] / scale,
    s: item[1] ? "mkd" : "area",
    r: item[2] ? 1 : 0
  };
}

function decodeBuildingRing(values, scale) {
  if (!Array.isArray(values)) return [];
  const ring = [];
  for (let i = 0; i < values.length - 1; i += 2) {
    ring.push([values[i] / scale, values[i + 1] / scale]);
  }
  return ring;
}

function renderCityMenu() {
  els.cityMenu.innerHTML = state.manifest.cities
    .map(
      (city) => `
        <article class="cityCard pkmn-card pkmn-card--rare" data-city="${city.slug}">
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
            <div><dt>3D-здания</dt><dd>${formatInt(city.stats3d.buildings)}</dd></div>
            <div><dt>Обзорные здания</dt><dd>${formatInt(city.stats3d.buildingsOverview)}</dd></div>
            <div><dt>Хорошие кварталы</dt><dd>${percent(city.highShare)}</dd></div>
          </dl>
        </article>`
    )
    .join("");

  for (const card of els.cityMenu.querySelectorAll(".cityCard")) {
    card.addEventListener("click", () => loadCity(card.dataset.city));
    card.addEventListener("pointermove", updateCityCardTilt);
    card.addEventListener("pointerleave", resetCityCardTilt);
  }
}

function updateCityCardTilt(event) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const mx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const my = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  const rotateX = (0.5 - my) * 9;
  const rotateY = (mx - 0.5) * 11;
  card.style.setProperty("--mx", mx.toFixed(3));
  card.style.setProperty("--my", my.toFixed(3));
  card.style.setProperty("--pos", `${(mx * 100).toFixed(1)}% ${(my * 100).toFixed(1)}%`);
  card.style.setProperty("--posx", `${(mx * 100).toFixed(1)}%`);
  card.style.setProperty("--posy", `${(my * 100).toFixed(1)}%`);
  card.style.setProperty("--glare-pos", `${(mx * 100).toFixed(1)}% ${(my * 100).toFixed(1)}%`);
  card.style.setProperty("--angle", `${(mx * 360).toFixed(1)}deg`);
  card.style.transform = `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
}

// @dist-split
function resetCityCardTilt(event) {
  const card = event.currentTarget;
  card.style.setProperty("--mx", "0.5");
  card.style.setProperty("--my", "0.5");
  card.style.setProperty("--pos", "50% 50%");
  card.style.setProperty("--posx", "50%");
  card.style.setProperty("--posy", "50%");
  card.style.setProperty("--glare-pos", "50% 50%");
  card.style.setProperty("--angle", "0deg");
  card.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg)";
}

function renderControls() {
  els.scenarioControls.innerHTML = `
    <button class="controlPanelTitle" type="button" aria-expanded="true">Сценарии индекса</button>
    <div class="controlPanelBody">
      ${BLOCKS.map(
    (block) => `
      <label class="toggle" title="${escapeAttr(block.help)}">
        <input type="checkbox" data-block="${block.key}" checked />
        ${block.label}
      </label>`
      ).join("")}
    </div>`;

  els.layerControls.innerHTML = `
    <button class="controlPanelTitle" type="button" aria-expanded="true">Слои</button>
    <div class="controlPanelBody">
      ${LAYERS.map(
    (layer) => `
      <label class="toggle">
        <input type="checkbox" data-layer="${layer.key}" ${state.layers[layer.key] ? "checked" : ""} />
        ${layer.label}
      </label>`
      ).join("")}
    </div>`;

  for (const panel of [els.scenarioControls, els.layerControls]) {
    const title = panel.querySelector(".controlPanelTitle");
    title.addEventListener("click", () => {
      panel.classList.toggle("collapsed");
      title.setAttribute("aria-expanded", String(!panel.classList.contains("collapsed")));
    });
  }

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
    if (!state.layers.dtp) state.accidentPopup = null;
    draw();
  });
}

function renderLegend() {
  els.legend.classList.toggle("legendHidden", !state.layers.quartals);
  els.legend.innerHTML = `
    <strong class="legendTitle">Сценарный индекс</strong>
    <div class="legendGradient"></div>
    <div class="legendScale"><span>0</span><span>50</span><span>100</span></div>
  `;
}

function renderSymbolLegend() {
  const items = [];
  if (state.layers.stops) {
    items.push(`<div><i class="dot bus"></i><span>Автобусная остановка</span></div>`);
    items.push(`<div><i class="dot tram"></i><span>Трамвайная остановка</span></div>`);
  }
  if (state.layers.dtp) items.push(`<div><i class="dot accident"></i><span>ДТП: размер по пострадавшим</span></div>`);
  els.symbolLegend.classList.toggle("hidden", items.length === 0);
  els.symbolLegend.classList.toggle("legendOffset", state.layers.quartals && items.length > 0);
  els.symbolLegend.innerHTML = items.join("");
}

// @dist-split
function attachEvents() {
  window.addEventListener("resize", resizeCanvases);
  overlayCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
  els.backButton.addEventListener("click", showCityMenu);
  document.getElementById("resetView").addEventListener("click", resetView);
  els.infoPanel.addEventListener("pointerdown", startSheetDrag);
  els.infoPanel.addEventListener("pointermove", moveSheetDrag);
  els.infoPanel.addEventListener("pointerup", endSheetDrag);
  els.infoPanel.addEventListener("pointercancel", endSheetDrag);
  els.infoPanel.addEventListener("click", (event) => {
    if (!isMobileLayout() || !event.target.closest(".sheetHandle")) return;
    if (performance.now() < state.suppressHandleClickUntil) return;
    els.infoPanel.classList.toggle("sheetExpanded");
  });

  overlayCanvas.addEventListener("pointerdown", (event) => {
    if (!state.data) return;
    stopCameraAnimation();
    rememberPointer(event);
    if (overlayCanvas.setPointerCapture) overlayCanvas.setPointerCapture(event.pointerId);
    if (event.pointerType === "touch" && state.activePointers.size >= 2) {
      beginPinchGesture();
      return;
    }
    if (state.pinchGesture) return;
    const mode = event.button === 2 || event.button === 1 || event.shiftKey ? "orbit" : "pan";
    overlayCanvas.classList.toggle("dragging", mode === "pan");
    overlayCanvas.classList.toggle("orbiting", mode === "orbit");
    state.dragging = {
      mode,
      x: event.clientX,
      y: event.clientY,
      startWorld: screenToWorld(event.offsetX, event.offsetY),
      startBearing: state.camera.bearing,
      startPitch: state.camera.pitch
    };
  });

  overlayCanvas.addEventListener("pointermove", (event) => {
    if (state.activePointers.has(event.pointerId)) rememberPointer(event);
    if (state.pinchGesture) {
      updatePinchGesture();
      return;
    }
    if (!state.dragging) return;
    if (state.dragging.mode === "orbit") {
      const dx = event.clientX - state.dragging.x;
      const dy = event.clientY - state.dragging.y;
      state.camera.bearing = state.dragging.startBearing + dx * 0.006;
      state.camera.pitch = clamp(state.dragging.startPitch - dy * 0.004, 0.34, 1.18);
      draw();
      return;
    }
    const current = screenToWorld(event.offsetX, event.offsetY);
    state.camera.center[0] += state.dragging.startWorld[0] - current[0];
    state.camera.center[1] += state.dragging.startWorld[1] - current[1];
    draw();
  });

  overlayCanvas.addEventListener("pointerup", (event) => {
    if (overlayCanvas.hasPointerCapture && overlayCanvas.hasPointerCapture(event.pointerId)) overlayCanvas.releasePointerCapture(event.pointerId);
    const wasPinching = Boolean(state.pinchGesture);
    forgetPointer(event.pointerId);
    if (wasPinching) {
      if (state.activePointers.size < 2) state.pinchGesture = null;
      overlayCanvas.classList.remove("dragging");
      overlayCanvas.classList.remove("orbiting");
      state.dragging = null;
      return;
    }
    overlayCanvas.classList.remove("dragging");
    overlayCanvas.classList.remove("orbiting");
    if (!state.dragging) return;
    const moved = Math.hypot(event.clientX - state.dragging.x, event.clientY - state.dragging.y) > 4;
    const wasPan = state.dragging.mode === "pan";
    state.dragging = null;
    if (wasPan && !moved) pickFeature(event);
  });

  overlayCanvas.addEventListener("pointercancel", (event) => {
    forgetPointer(event.pointerId);
    state.pinchGesture = null;
    overlayCanvas.classList.remove("dragging");
    overlayCanvas.classList.remove("orbiting");
    state.dragging = null;
  });

  overlayCanvas.addEventListener(
    "wheel",
    (event) => {
      if (!state.data) return;
      stopCameraAnimation();
      event.preventDefault();
      const rect = overlayCanvas.getBoundingClientRect();
      const cursor = [event.clientX - rect.left, event.clientY - rect.top];
      const before = screenToWorld(cursor[0], cursor[1]);
      const factor = event.deltaY < 0 ? 1.18 : 0.84;
      state.camera.scale = clamp(state.camera.scale * factor, state.camera.fitScale * 0.58, state.camera.fitScale * 16);
      const after = screenToWorld(cursor[0], cursor[1]);
      state.camera.center[0] += before[0] - after[0];
      state.camera.center[1] += before[1] - after[1];
      draw();
    },
    { passive: false }
  );
}

// @dist-split
function rememberPointer(event) {
  state.activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });
}

function forgetPointer(pointerId) {
  state.activePointers.delete(pointerId);
}

function pinchPointers() {
  const pointers = [];
  for (const pointer of state.activePointers.values()) {
    pointers.push(pointer);
    if (pointers.length === 2) break;
  }
  return pointers.length === 2 ? pointers : null;
}

function beginPinchGesture() {
  const pointers = pinchPointers();
  if (!pointers) return;
  const midpoint = pinchMidpoint(pointers);
  state.dragging = null;
  overlayCanvas.classList.remove("dragging");
  overlayCanvas.classList.remove("orbiting");
  state.pinchGesture = {
    startDistance: Math.max(1, pinchDistance(pointers)),
    startScale: state.camera.scale,
    startWorld: screenToWorld(midpoint[0], midpoint[1])
  };
}

function updatePinchGesture() {
  const pointers = pinchPointers();
  if (!pointers || !state.pinchGesture) return;
  const midpoint = pinchMidpoint(pointers);
  const factor = pinchDistance(pointers) / state.pinchGesture.startDistance;
  state.camera.scale = clamp(
    state.pinchGesture.startScale * factor,
    state.camera.fitScale * 0.58,
    state.camera.fitScale * 16
  );
  const after = screenToWorld(midpoint[0], midpoint[1]);
  state.camera.center[0] += state.pinchGesture.startWorld[0] - after[0];
  state.camera.center[1] += state.pinchGesture.startWorld[1] - after[1];
  draw();
}

function pinchDistance(pointers) {
  return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
}

function pinchMidpoint(pointers) {
  const rect = overlayCanvas.getBoundingClientRect();
  return [
    (pointers[0].x + pointers[1].x) / 2 - rect.left,
    (pointers[0].y + pointers[1].y) / 2 - rect.top
  ];
}

function isMobileLayout() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function startSheetDrag(event) {
  if (!isMobileLayout()) return;
  const expanded = els.infoPanel.classList.contains("sheetExpanded");
  const fromHandle = Boolean(event.target.closest(".sheetHandle"));
  const fromTop = event.clientY - els.infoPanel.getBoundingClientRect().top < 112;
  if (expanded && !fromHandle && !(fromTop && els.infoPanel.scrollTop <= 4)) return;
  if (fromHandle || !expanded) event.preventDefault();
  state.sheetDrag = {
    pointerId: event.pointerId,
    startY: event.clientY,
    expanded,
    fromHandle,
    moved: false
  };
  if (els.infoPanel.setPointerCapture) els.infoPanel.setPointerCapture(event.pointerId);
}

function moveSheetDrag(event) {
  if (!state.sheetDrag || state.sheetDrag.pointerId !== event.pointerId) return;
  const dy = event.clientY - state.sheetDrag.startY;
  if (Math.abs(dy) > 8) state.sheetDrag.moved = true;
  if (Math.abs(dy) > 6 && (state.sheetDrag.fromHandle || !state.sheetDrag.expanded || els.infoPanel.scrollTop <= 4)) event.preventDefault();
  if (dy < -28) els.infoPanel.classList.add("sheetExpanded");
  if (dy > 24 && (state.sheetDrag.fromHandle || els.infoPanel.scrollTop <= 4)) {
    els.infoPanel.classList.remove("sheetExpanded");
  }
}

function endSheetDrag(event) {
  if (!state.sheetDrag || state.sheetDrag.pointerId !== event.pointerId) return;
  const dy = event.clientY - state.sheetDrag.startY;
  if (state.sheetDrag.moved) state.suppressHandleClickUntil = performance.now() + 420;
  if (dy < -20) els.infoPanel.classList.add("sheetExpanded");
  else if (dy > 18 && (state.sheetDrag.fromHandle || els.infoPanel.scrollTop <= 4)) {
    els.infoPanel.classList.remove("sheetExpanded");
  } else if (state.sheetDrag.fromHandle && Math.abs(dy) < 8) {
    els.infoPanel.classList.toggle("sheetExpanded");
    state.suppressHandleClickUntil = performance.now() + 420;
  }
  if (els.infoPanel.hasPointerCapture && els.infoPanel.hasPointerCapture(event.pointerId)) els.infoPanel.releasePointerCapture(event.pointerId);
  state.sheetDrag = null;
}

async function loadCity(slug) {
  const city = state.manifest.cities.find((item) => item.slug === slug);
  if (!city) return;
  const token = state.renderToken + 1;
  state.renderToken = token;
  stopPulse();
  clearMeshes();
  state.activeCity = city;
  state.selected = null;
  state.accidentPopup = null;
  state.panelValues = null;
  els.title.textContent = city.name;
  els.topMetric.textContent = `Индекс ${formatNumber(city.index, 2)} · ${formatInt(city.population)} жителей`;
  els.cityMenu.classList.add("hidden");
  els.mapShell.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  els.infoPanel.classList.remove("sheetExpanded");
  els.infoPanel.innerHTML = `<div class="muted">Загрузка 3D-данных</div>`;

  const [quartals, green, water, roads, railways, points, overview] = await Promise.all([
    fetchJson(city.files3d.quartals),
    fetchJson(city.files3d.green),
    fetchJson(city.files3d.water),
    fetchJson(city.files3d.roads),
    fetchJson(city.files3d.railways),
    fetchJson(city.files3d.points),
    fetchJson(city.files3d.buildingsOverview)
  ]);
  if (token !== state.renderToken) return;
  const overviewBuildings = decodeBuildings(overview);

  state.data = {
    city,
    bbox: city.projectedBbox,
    tileCount: city.tileCount,
    availableBuildingTiles: new Set(city.tiles3d.buildings),
    availableRoadTiles: new Set(city.tiles3d.roadsAll),
    quartals: quartals.features.map(withCenter),
    green: green.features.map(withCenter),
    water: water.features.map(withCenter),
    roads: roads.lines,
    railways: railways.lines,
    points,
    overviewBuildings
  };

  state.overviewMesh = createBuildingMesh(overviewBuildings);
  resizeCanvases();
  resetView();
  recomputeScores();
  updatePanel();
  draw();
}

// @dist-split
function showCityMenu() {
  stopPulse();
  clearMeshes();
  state.activeCity = null;
  state.data = null;
  state.selected = null;
  state.accidentPopup = null;
  hideAccidentPopup();
  els.title.textContent = "Города исследования";
  els.topMetric.textContent = "";
  els.mapShell.classList.add("hidden");
  els.backButton.classList.add("hidden");
  els.cityMenu.classList.remove("hidden");
}

function clearMeshes() {
  stopCameraAnimation();
  if (gl) {
    for (const mesh of state.tileMeshes.values()) gl.deleteBuffer(mesh.buffer);
    if (state.overviewMesh) gl.deleteBuffer(state.overviewMesh.buffer);
  }
  state.overviewMesh = null;
  state.tileMeshes.clear();
  state.tileBuildingFeatures.clear();
  state.roadTiles.clear();
  state.loadingTiles.clear();
  state.requestedTiles.clear();
}

function withCenter(feature) {
  const bbox = feature.bbox;
  return {
    ...feature,
    center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
  };
}

function resizeCanvases() {
  const rect = overlayCanvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  for (const canvas of [baseCanvas, overlayCanvas, glCanvas]) {
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
  }
  baseCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  overlayCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (gl) gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  if (state.data) draw();
}

function resetView() {
  if (!state.data) return;
  const [minX, minY, maxX, maxY] = state.data.bbox;
  state.camera.center = [(minX + maxX) / 2, (minY + maxY) / 2];
  state.camera.bearing = -0.66;
  state.camera.pitch = 0.82;
  const rect = overlayCanvas.getBoundingClientRect();
  const extent = projectedScreenExtent(state.data.bbox, state.camera.center);
  const usableWidth = Math.max(320, rect.width - 420);
  const usableHeight = Math.max(320, rect.height - 80);
  const scale = Math.min(usableWidth / extent.width, usableHeight / extent.height) * 0.8;
  state.camera.scale = scale;
  state.camera.fitScale = scale;
  draw();
}

function projectedScreenExtent(bbox, center) {
  const corners = [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[1]],
    [bbox[2], bbox[3]],
    [bbox[0], bbox[3]]
  ].map(([x, y]) => transformWorld(x, y, 0, center));
  const box = bboxFromPoints(corners);
  return { width: box[2] - box[0], height: box[3] - box[1] };
}

function transformWorld(x, y, z = 0, center = state.camera.center) {
  const dx = x - center[0];
  const dy = y - center[1];
  const cos = Math.cos(state.camera.bearing);
  const sin = Math.sin(state.camera.bearing);
  const rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  const pitchCos = Math.cos(state.camera.pitch);
  const pitchSin = Math.sin(state.camera.pitch);
  return [rx, ry * pitchCos + z * pitchSin, ry * pitchSin - z * pitchCos];
}

function worldToScreen(x, y, z = 0) {
  const rect = overlayCanvas.getBoundingClientRect();
  const [tx, ty] = transformWorld(x, y, z);
  return [rect.width / 2 + tx * state.camera.scale, rect.height / 2 - ty * state.camera.scale];
}

function screenToWorld(sx, sy) {
  const rect = overlayCanvas.getBoundingClientRect();
  const rx = (sx - rect.width / 2) / state.camera.scale;
  const ry = -((sy - rect.height / 2) / state.camera.scale) / Math.cos(state.camera.pitch);
  const cos = Math.cos(state.camera.bearing);
  const sin = Math.sin(state.camera.bearing);
  return [
    state.camera.center[0] + rx * cos + ry * sin,
    state.camera.center[1] - rx * sin + ry * cos
  ];
}

function draw() {
  if (!state.data) return;
  renderLegend();
  renderSymbolLegend();
  drawBase();
  drawBuildings();
  drawOverlay();
  renderAccidentPopup();
  requestVisibleTiles();
}

function drawBase() {
  const rect = overlayCanvas.getBoundingClientRect();
  baseCtx.clearRect(0, 0, rect.width, rect.height);
  baseCtx.fillStyle = "#e7e0d3";
  baseCtx.fillRect(0, 0, rect.width, rect.height);
  drawGrid(baseCtx, rect);

  drawPolygonLayer(baseCtx, state.data.water, "rgba(87, 145, 176, 0.44)", "rgba(54, 106, 138, 0.32)", 0);
  drawPolygonLayer(baseCtx, state.data.green, "rgba(80, 130, 78, 0.34)", "rgba(61, 92, 58, 0.2)", 0);
  if (state.layers.quartals) drawQuartals(baseCtx);
  if (state.layers.buildings) drawBuildingFootprints(baseCtx);
  drawRailways(baseCtx);
  drawRoads(baseCtx);
}

function drawGrid(ctx, rect) {
  ctx.save();
  ctx.strokeStyle = "rgba(94, 91, 84, 0.085)";
  ctx.lineWidth = 1;
  const step = 72;
  for (let x = 0; x < rect.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = 0; y < rect.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

// @dist-split
function drawQuartals(ctx) {
  const view = worldViewBbox();
  for (const feature of state.data.quartals) {
    if (!bboxIntersects(feature.bbox, view)) continue;
    const score = feature.properties.currentScore != null ? feature.properties.currentScore : feature.properties.baseScore;
    drawPath(ctx, feature.polygons, 0);
    ctx.fillStyle = scoreColor(score, 0.82);
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(64, 66, 62, 0.72)";
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }
}

// @dist-split
function drawRoads(ctx) {
  const mainAlpha = zoomFade(0.13, 0.46, 2.7);
  const detailAlpha = zoomFade(0.05, 0.22, 4.4);
  ctx.save();
  if (state.camera.scale >= state.camera.fitScale * ROAD_DETAIL_FACTOR) {
    ctx.lineWidth = 0.72;
    ctx.strokeStyle = `rgba(91, 96, 96, ${detailAlpha})`;
    for (const tile of state.roadTiles.values()) {
      for (const segment of tile.segments) drawLine(ctx, segment, 4);
    }
  }
  ctx.lineWidth = 1.28;
  ctx.strokeStyle = `rgba(47, 54, 55, ${mainAlpha})`;
  for (const line of state.data.roads) drawLine(ctx, line, 6);
  ctx.restore();
}

function drawRailways(ctx) {
  if (!state.data.railways || !state.data.railways.length) return;
  const alpha = zoomFade(0.18, 0.54, 3.2);
  ctx.save();
  ctx.lineWidth = 2.1;
  ctx.strokeStyle = `rgba(62, 61, 58, ${alpha})`;
  for (const line of state.data.railways) drawLine(ctx, line, 7);
  ctx.lineWidth = 1.05;
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = `rgba(244, 238, 226, ${Math.min(0.72, alpha + 0.18)})`;
  for (const line of state.data.railways) drawLine(ctx, line, 7.4);
  ctx.restore();
}

function zoomFade(minAlpha, maxAlpha, fullAtRatio) {
  const t = zoomProgress(fullAtRatio);
  return minAlpha + (maxAlpha - minAlpha) * t;
}

function zoomProgress(fullAtRatio) {
  const ratio = state.camera.scale / (state.camera.fitScale || state.camera.scale || 1);
  return clamp((ratio - 0.7) / (fullAtRatio - 0.7), 0, 1);
}

function buildingAlphaFactor() {
  return zoomFade(0.015, 1, BUILDING_FADE_FACTOR);
}

function buildingLightenFactor() {
  return 1 - zoomProgress(BUILDING_FADE_FACTOR);
}

function drawBuildingFootprints(ctx) {
  if (state.camera.scale >= state.camera.fitScale * DETAIL_FACTOR) return;
  const view = worldViewBbox();
  const features = currentBuildingFeatures();
  const alpha = zoomFade(0.01, 0.045, DETAIL_FACTOR);
  ctx.save();
  ctx.lineWidth = 0.25;
  ctx.strokeStyle = `rgba(76, 76, 70, ${alpha})`;
  for (const feature of features) {
    if (!bboxIntersects(feature.bbox, view)) continue;
    drawPath(ctx, feature.polygons, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function currentBuildingFeatures() {
  if (state.camera.scale < state.camera.fitScale * DETAIL_FACTOR || state.tileBuildingFeatures.size === 0) {
    return state.data.overviewBuildings;
  }
  const features = [];
  for (const tileFeatures of state.tileBuildingFeatures.values()) features.push(...tileFeatures);
  return features;
}

function drawPolygonLayer(ctx, features, fill, stroke, z = 0) {
  const view = worldViewBbox();
  for (const feature of features) {
    if (!bboxIntersects(feature.bbox, view)) continue;
    drawPath(ctx, feature.polygons, z);
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }
}

function drawLine(ctx, line, z = 0) {
  if (!line.length) return;
  ctx.beginPath();
  line.forEach(([x, y], index) => {
    const [sx, sy] = worldToScreen(x, y, z);
    if (index === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  });
  ctx.stroke();
}

function drawPath(ctx, polygons, z) {
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

function drawBuildings() {
  if (!gl || !glState) return;
  const ratio = window.devicePixelRatio || 1;
  const rect = overlayCanvas.getBoundingClientRect();
  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (!state.layers.buildings) return;

  gl.useProgram(glState.program);
  gl.uniform2f(glState.uniforms.center, state.camera.center[0], state.camera.center[1]);
  gl.uniform2f(glState.uniforms.viewport, rect.width * ratio, rect.height * ratio);
  gl.uniform1f(glState.uniforms.scale, state.camera.scale * ratio);
  gl.uniform1f(glState.uniforms.bearingCos, Math.cos(state.camera.bearing));
  gl.uniform1f(glState.uniforms.bearingSin, Math.sin(state.camera.bearing));
  gl.uniform1f(glState.uniforms.pitchCos, Math.cos(state.camera.pitch));
  gl.uniform1f(glState.uniforms.pitchSin, Math.sin(state.camera.pitch));
  gl.uniform1f(glState.uniforms.heightScale, HEIGHT_EXAGGERATION);
  gl.uniform1f(glState.uniforms.alphaFactor, buildingAlphaFactor());
  gl.uniform1f(glState.uniforms.lightenFactor, buildingLightenFactor());
  gl.uniform1f(glState.uniforms.depthScale, 62000);

  if (state.camera.scale < state.camera.fitScale * DETAIL_FACTOR || state.tileMeshes.size === 0) {
    drawMesh(state.overviewMesh);
  }
  if (state.camera.scale >= state.camera.fitScale * DETAIL_FACTOR) {
    for (const mesh of state.tileMeshes.values()) drawMesh(mesh);
  }
}

function drawOverlay() {
  const rect = overlayCanvas.getBoundingClientRect();
  overlayCtx.clearRect(0, 0, rect.width, rect.height);
  if (state.selected) drawSelected();
  if (state.layers.stops) drawStops();
  if (state.layers.dtp) drawAccidents();
}

function drawSelected() {
  const phase = performance.now() / 1450;
  const z = 10 + (Math.sin(phase) + 1) * 7;
  drawPath(overlayCtx, state.selected.polygons, z);
  overlayCtx.fillStyle = "rgba(255, 246, 199, 0.16)";
  overlayCtx.fill("evenodd");
  overlayCtx.strokeStyle = "rgba(30, 37, 40, 0.42)";
  overlayCtx.lineWidth = 6;
  overlayCtx.stroke();
  drawPath(overlayCtx, state.selected.polygons, z);
  overlayCtx.strokeStyle = "#1e2528";
  overlayCtx.lineWidth = 2.4;
  overlayCtx.stroke();
}

function drawStops() {
  overlayCtx.save();
  overlayCtx.strokeStyle = "#ffffff";
  overlayCtx.lineWidth = 1;
  for (const item of state.data.points.stops) {
    const [sx, sy] = worldToScreen(item.point[0], item.point[1], 12);
    const isTram = item.properties.source === "tram_stop";
    overlayCtx.fillStyle = isTram ? "#b64c3f" : "#316a9c";
    overlayCtx.beginPath();
    if (isTram) overlayCtx.rect(sx - 3.4, sy - 3.4, 6.8, 6.8);
    else overlayCtx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    overlayCtx.fill();
    overlayCtx.stroke();
  }
  overlayCtx.restore();
}

function drawAccidents() {
  state.accidentDisplayItems = buildAccidentDisplayItems();
  overlayCtx.save();
  overlayCtx.strokeStyle = "#ffffff";
  overlayCtx.lineWidth = 1;
  overlayCtx.textAlign = "center";
  overlayCtx.textBaseline = "middle";
  overlayCtx.font = "700 11px system-ui, sans-serif";
  for (const item of state.accidentDisplayItems) {
    const radius = accidentRadius(item);
    const [sx, sy] = worldToScreen(item.point[0], item.point[1], 15);
    overlayCtx.fillStyle = item.items ? "#893a35" : "#b64c3f";
    overlayCtx.beginPath();
    overlayCtx.arc(sx, sy, radius, 0, Math.PI * 2);
    overlayCtx.fill();
    overlayCtx.stroke();
    if (item.items) {
      overlayCtx.fillStyle = "#fffaf1";
      overlayCtx.fillText(String(item.items.length), sx, sy + 0.5);
    }
  }
  overlayCtx.restore();
}

// @dist-split
function accidentRadius(item) {
  if (item.items) {
    const severity = item.properties.severity ?? item.items.length;
    return clamp(7 + Math.sqrt(item.items.length) * 3.2 + Math.sqrt(Math.max(severity, 1)) * 0.55, 10, 25);
  }
  const severity = item.properties.severity != null ? item.properties.severity : item.properties.injured != null ? item.properties.injured : 1;
  return clamp(2.8 + Math.sqrt(Math.max(severity, 1)) * 2.2, 3.5, 13);
}

function buildAccidentDisplayItems() {
  if (!state.layers.dtp || !state.data?.points?.dtp?.length) return [];
  const clusterDistance = accidentClusterDistance();
  const clusters = [];
  for (const item of state.data.points.dtp) {
    const [sx, sy] = worldToScreen(item.point[0], item.point[1], 15);
    let cluster = null;
    for (const candidate of clusters) {
      if (Math.hypot(candidate.sx - sx, candidate.sy - sy) <= clusterDistance) {
        cluster = candidate;
        break;
      }
    }
    if (!cluster) {
      clusters.push({ sx, sy, wx: item.point[0], wy: item.point[1], items: [item] });
      continue;
    }
    const nextCount = cluster.items.length + 1;
    cluster.sx = (cluster.sx * cluster.items.length + sx) / nextCount;
    cluster.sy = (cluster.sy * cluster.items.length + sy) / nextCount;
    cluster.wx = (cluster.wx * cluster.items.length + item.point[0]) / nextCount;
    cluster.wy = (cluster.wy * cluster.items.length + item.point[1]) / nextCount;
    cluster.items.push(item);
  }
  return clusters.map((cluster) => {
    if (cluster.items.length === 1) return cluster.items[0];
    const injured = cluster.items.reduce((sum, item) => sum + (Number(item.properties.injured) || 0), 0);
    const dead = cluster.items.reduce((sum, item) => sum + (Number(item.properties.dead) || 0), 0);
    return {
      items: cluster.items,
      point: [cluster.wx, cluster.wy],
      properties: {
        type: "Кластер ДТП",
        injured,
        dead,
        severity: injured + dead * 3
      }
    };
  });
}

function accidentClusterDistance() {
  return clamp(44 - zoomProgress(12) * 28, 16, 44);
}

// @dist-split
function createBuildingMesh(features) {
  if (!gl || !features || !features.length) return null;
  const vertices = [];
  for (const feature of features) {
    const height = (feature.h || 8) * (feature.s === "mkd" ? 1 : NON_MKD_HEIGHT_FACTOR);
    const colors = buildingColors(feature);
    for (const polygon of feature.polygons) {
      const outer = openRing(polygon[0]);
      if (outer.length < 3) continue;
      for (let i = 0; i < outer.length; i += 1) {
        const a = outer[i];
        const b = outer[(i + 1) % outer.length];
        pushWall(vertices, a, b, height, colors, wallShade(a, b));
      }
      const roofHeight = height;
      for (const triangle of triangulateRoof(outer)) {
        pushTriangle(vertices, triangle[0], roofHeight, triangle[1], roofHeight, triangle[2], roofHeight, colors.roof);
      }
    }
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  return { buffer, count: vertices.length / FLOATS_PER_VERTEX };
}

function buildingColors(feature) {
  if (isResidentialBuilding(feature)) {
    return {
      roof: [0.64, 0.64, 0.61, 1],
      sideTop: [0.61, 0.61, 0.58, 1],
      sideBottom: [0.55, 0.55, 0.52, 1]
    };
  }
  return {
    roof: [0.78, 0.78, 0.74, 1],
    sideTop: [0.75, 0.75, 0.71, 1],
    sideBottom: [0.69, 0.69, 0.65, 1]
  };
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
    const area = signedTriangleArea(prev, current, next);
    if (Math.abs(area) > 0.001) result.push(current);
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
    const point = points[index];
    if (pointInTriangle(point, a, b, c)) return true;
  }
  return false;
}

// @dist-split
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

function pushTriangle(target, a, za, b, zb, c, zc, color) {
  pushVertex(target, a, za, color);
  pushVertex(target, b, zb, color);
  pushVertex(target, c, zc, color);
}

function pushWall(target, a, b, height, colors, shade) {
  const top = scaleColor(colors.sideTop, shade);
  const bottom = scaleColor(colors.sideBottom, shade);
  pushVertex(target, a, 0, bottom);
  pushVertex(target, b, 0, bottom);
  pushVertex(target, b, height, top);
  pushVertex(target, a, 0, bottom);
  pushVertex(target, b, height, top);
  pushVertex(target, a, height, top);
}

function pushVertex(target, point, z, color) {
  target.push(point[0], point[1], z, color[0], color[1], color[2], color[3]);
}

function scaleColor(color, factor) {
  return [
    clamp(color[0] * factor, 0, 1),
    clamp(color[1] * factor, 0, 1),
    clamp(color[2] * factor, 0, 1),
    color[3]
  ];
}

function drawMesh(mesh) {
  if (!mesh || mesh.count === 0) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
  gl.enableVertexAttribArray(glState.attributes.position);
  gl.enableVertexAttribArray(glState.attributes.color);
  gl.vertexAttribPointer(glState.attributes.position, 3, gl.FLOAT, false, FLOATS_PER_VERTEX * 4, 0);
  gl.vertexAttribPointer(glState.attributes.color, 4, gl.FLOAT, false, FLOATS_PER_VERTEX * 4, 3 * 4);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
}

// @dist-split
function initGl(glContext) {
  const vertexSource = `
    attribute vec3 a_pos;
    attribute vec4 a_color;
    uniform vec2 u_center;
    uniform vec2 u_viewport;
    uniform float u_scale;
    uniform float u_bearingCos;
    uniform float u_bearingSin;
    uniform float u_pitchCos;
    uniform float u_pitchSin;
    uniform float u_heightScale;
    uniform float u_alphaFactor;
    uniform float u_lightenFactor;
    uniform float u_depthScale;
    varying vec4 v_color;

    void main() {
      float height = a_pos.z * u_heightScale;
      float dx = a_pos.x - u_center.x;
      float dy = a_pos.y - u_center.y;
      float rx = dx * u_bearingCos - dy * u_bearingSin;
      float ry = dx * u_bearingSin + dy * u_bearingCos;
      float sy = ry * u_pitchCos + height * u_pitchSin;
      float depth = ry * u_pitchSin - height * u_pitchCos;
      gl_Position = vec4(
        (rx * u_scale) / (u_viewport.x * 0.5),
        (sy * u_scale) / (u_viewport.y * 0.5),
        depth / u_depthScale,
        1.0
      );
      v_color = a_color;
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec4 v_color;
    uniform float u_alphaFactor;
    uniform float u_lightenFactor;
    void main() {
      vec3 liftedColor = mix(v_color.rgb, vec3(0.92, 0.92, 0.88), u_lightenFactor * 0.48);
      gl_FragColor = vec4(liftedColor, v_color.a * u_alphaFactor);
    }
  `;

  const program = createProgram(glContext, vertexSource, fragmentSource);
  glContext.enable(glContext.DEPTH_TEST);
  glContext.depthFunc(glContext.LEQUAL);
  glContext.enable(glContext.BLEND);
  glContext.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);
  return {
    program,
    attributes: {
      position: glContext.getAttribLocation(program, "a_pos"),
      color: glContext.getAttribLocation(program, "a_color")
    },
    uniforms: {
      center: glContext.getUniformLocation(program, "u_center"),
      viewport: glContext.getUniformLocation(program, "u_viewport"),
      scale: glContext.getUniformLocation(program, "u_scale"),
      bearingCos: glContext.getUniformLocation(program, "u_bearingCos"),
      bearingSin: glContext.getUniformLocation(program, "u_bearingSin"),
      pitchCos: glContext.getUniformLocation(program, "u_pitchCos"),
      pitchSin: glContext.getUniformLocation(program, "u_pitchSin"),
      heightScale: glContext.getUniformLocation(program, "u_heightScale"),
      alphaFactor: glContext.getUniformLocation(program, "u_alphaFactor"),
      lightenFactor: glContext.getUniformLocation(program, "u_lightenFactor"),
      depthScale: glContext.getUniformLocation(program, "u_depthScale")
    }
  };
}

// @dist-split
function createProgram(glContext, vertexSource, fragmentSource) {
  const vertex = createShader(glContext, glContext.VERTEX_SHADER, vertexSource);
  const fragment = createShader(glContext, glContext.FRAGMENT_SHADER, fragmentSource);
  const program = glContext.createProgram();
  glContext.attachShader(program, vertex);
  glContext.attachShader(program, fragment);
  glContext.linkProgram(program);
  if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
    throw new Error(glContext.getProgramInfoLog(program));
  }
  return program;
}

function createShader(glContext, type, source) {
  const shader = glContext.createShader(type);
  glContext.shaderSource(shader, source);
  glContext.compileShader(shader);
  if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
    throw new Error(glContext.getShaderInfoLog(shader));
  }
  return shader;
}

function requestVisibleTiles() {
  if (!state.data || state.camera.scale < state.camera.fitScale * DETAIL_FACTOR) return;
  const keys = visibleTileKeys();
  for (const key of keys) {
    if (state.requestedTiles.has(key)) continue;
    state.requestedTiles.add(key);
    state.loadingTiles.add(key);
    loadTile(key).catch((error) => {
      console.error(error);
      state.loadingTiles.delete(key);
    });
  }
}

async function loadTile(key) {
  const city = state.activeCity;
  const jobs = [];
  if (state.data.availableBuildingTiles.has(key)) {
    jobs.push(
      fetchJson(`${city.files3d.buildingsTileBase}/${key}.json`).then((payload) => {
        const features = decodeBuildings(payload);
        state.tileMeshes.set(key, createBuildingMesh(features));
        state.tileBuildingFeatures.set(key, features);
      })
    );
  }
  if (state.data.availableRoadTiles.has(key)) {
    jobs.push(
      fetchJson(`${city.files3d.roadsAllTileBase}/${key}.json`).then((payload) => {
        state.roadTiles.set(key, payload);
      })
    );
  }
  await Promise.all(jobs);
  state.loadingTiles.delete(key);
  draw();
}

function visibleTileKeys() {
  const view = worldViewBbox();
  const [minX, minY, maxX, maxY] = state.data.bbox;
  const tileWidth = (maxX - minX) / state.data.tileCount;
  const tileHeight = (maxY - minY) / state.data.tileCount;
  const x0 = clamp(Math.floor((view[0] - minX) / tileWidth), 0, state.data.tileCount - 1);
  const x1 = clamp(Math.floor((view[2] - minX) / tileWidth), 0, state.data.tileCount - 1);
  const y0 = clamp(Math.floor((view[1] - minY) / tileHeight), 0, state.data.tileCount - 1);
  const y1 = clamp(Math.floor((view[3] - minY) / tileHeight), 0, state.data.tileCount - 1);
  const keys = [];
  for (let x = x0; x <= x1; x += 1) {
    for (let y = y0; y <= y1; y += 1) {
      const key = `${x}-${y}`;
      if (state.data.availableBuildingTiles.has(key) || state.data.availableRoadTiles.has(key)) keys.push(key);
    }
  }
  return keys;
}

function recomputeScores() {
  if (!state.data) return;
  const active = [...state.activeBlocks];
  for (const feature of state.data.quartals) {
    const values = active
      .map((key) => feature.properties.blocks ? feature.properties.blocks[key] : undefined)
      .filter((value) => Number.isFinite(value));
    feature.properties.currentScore = values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length) * 100 : null;
  }
  const ranked = state.data.quartals
    .filter((feature) => Number.isFinite(feature.properties.currentScore))
    .sort((a, b) => b.properties.currentScore - a.properties.currentScore);
  ranked.forEach((feature, index) => {
    feature.properties.currentRank = index + 1;
  });
}

function cityScenarioScore() {
  if (!state.data) return null;
  let weighted = 0;
  let total = 0;
  for (const feature of state.data.quartals) {
    const score = feature.properties.currentScore;
    const weight = feature.properties.population;
    if (!Number.isFinite(score) || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += score * weight;
    total += weight;
  }
  return total > 0 ? weighted / total : null;
}

function cityBlockScores() {
  const result = {};
  for (const block of BLOCKS) {
    let weighted = 0;
    let total = 0;
    for (const feature of state.data.quartals) {
      const value = feature.properties.blocks ? feature.properties.blocks[block.key] : undefined;
      const weight = feature.properties.population;
      if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) continue;
      weighted += value * 100 * weight;
      total += weight;
    }
    result[block.key] = total > 0 ? weighted / total : null;
  }
  return result;
}

function pickFeature(event) {
  if (!state.data) return;
  const rect = overlayCanvas.getBoundingClientRect();
  const screen = [event.clientX - rect.left, event.clientY - rect.top];
  const accident = pickAccident(screen[0], screen[1]);
  if (accident) {
    if (accident.items && shouldZoomAccidentCluster(accident)) {
      state.accidentPopup = null;
      state.selected = null;
      stopPulse();
      updatePanel();
      zoomToAccidentCluster(accident);
      return;
    }
    state.accidentPopup = accident;
    state.selected = null;
    stopPulse();
    updatePanel();
    draw();
    return;
  }
  state.accidentPopup = null;
  const world = screenToWorld(screen[0], screen[1]);
  const hit = [...state.data.quartals]
    .sort((a, b) => depthOf(b) - depthOf(a))
    .find((feature) => pointInFeature(feature, world));
  state.selected = hit || null;
  if (state.selected) startPulse();
  else stopPulse();
  updatePanel();
  draw();
}

// @dist-split
function pickAccident(screenX, screenY) {
  if (!state.layers.dtp || !state.data || !state.data.points || !state.data.points.dtp || !state.data.points.dtp.length) return null;
  let best = null;
  let bestDistance = Infinity;
  const items = state.accidentDisplayItems.length ? state.accidentDisplayItems : buildAccidentDisplayItems();
  for (const item of items) {
    const [sx, sy] = worldToScreen(item.point[0], item.point[1], 15);
    const radius = accidentRadius(item) + 5;
    const distance = Math.hypot(screenX - sx, screenY - sy);
    if (distance <= radius && distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  }
  return best;
}

function shouldZoomAccidentCluster(cluster) {
  return cluster.items?.length > 1 && state.camera.scale < state.camera.fitScale * 13.5;
}

function zoomToAccidentCluster(cluster) {
  const targetScale = Math.min(state.camera.scale * 2.35, state.camera.fitScale * 16);
  animateCameraTo(cluster.point, targetScale, 720);
}

function animateCameraTo(targetCenter, targetScale, duration = 650) {
  stopCameraAnimation();
  const startCenter = [...state.camera.center];
  const startScale = state.camera.scale;
  const startTime = performance.now();
  const tick = (time) => {
    const t = clamp((time - startTime) / duration, 0, 1);
    const eased = t * t * (3 - 2 * t);
    state.camera.center = [
      startCenter[0] + (targetCenter[0] - startCenter[0]) * eased,
      startCenter[1] + (targetCenter[1] - startCenter[1]) * eased
    ];
    state.camera.scale = startScale + (targetScale - startScale) * eased;
    draw();
    if (t < 1) {
      state.cameraAnimation = requestAnimationFrame(tick);
    } else {
      state.cameraAnimation = null;
    }
  };
  state.cameraAnimation = requestAnimationFrame(tick);
}

function stopCameraAnimation() {
  if (state.cameraAnimation) cancelAnimationFrame(state.cameraAnimation);
  state.cameraAnimation = null;
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
  const [sx, sy] = worldToScreen(item.point[0], item.point[1], 30);
  const props = item.properties;
  if (item.items) {
    const rows = item.items.slice(0, 8).map((accident) => {
      const accidentProps = accident.properties;
      const when = [accidentProps.date, accidentProps.time].filter(Boolean).join(" ");
      const title = accidentProps.type || "ДТП";
      return `<li><b>${escapeAttr(title)}</b><span>${escapeAttr(when || "Дата не указана")}</span><small>${formatInt(accidentProps.injured || 0)} постр. · ${formatInt(accidentProps.dead || 0)} погиб.</small></li>`;
    }).join("");
    const extra = item.items.length > 8 ? `<small>Ещё ДТП: ${formatInt(item.items.length - 8)}</small>` : "";
    els.accidentPopup.classList.remove("hidden");
    els.accidentPopup.style.left = `${sx}px`;
    els.accidentPopup.style.top = `${sy}px`;
    els.accidentPopup.innerHTML = `
      <strong>ДТП: ${formatInt(item.items.length)}</strong>
      <span>Пострадавшие: ${formatInt(props.injured || 0)}</span>
      <span>Погибшие: ${formatInt(props.dead || 0)}</span>
      <ul class="accidentList">${rows}</ul>
      ${extra}
    `;
    return;
  }
  const when = [props.date, props.time].filter(Boolean).join(" ");
  els.accidentPopup.classList.remove("hidden");
  els.accidentPopup.style.left = `${sx}px`;
  els.accidentPopup.style.top = `${sy}px`;
  els.accidentPopup.innerHTML = `
    <strong>${props.type || "ДТП"}</strong>
    <span>${when || "Дата не указана"}</span>
    <span>Пострадавшие: ${formatInt(props.injured != null ? props.injured : 0)}</span>
    <span>Погибшие: ${formatInt(props.dead != null ? props.dead : 0)}</span>
    ${props.address ? `<small>${props.address}</small>` : ""}
  `;
}

function hideAccidentPopup() {
  els.accidentPopup.classList.add("hidden");
  els.accidentPopup.innerHTML = "";
}

// @dist-split
function updatePanel() {
  if (!state.activeCity || !state.data) return;
  const cityScore = cityScenarioScore();
  const previousValues = state.panelValues;
  const nextValues = panelAnimationValues(cityScore);
  els.topMetric.textContent = `Сценарный индекс ${formatNumber(cityScore, 2)} · Основной индекс ${formatNumber(state.activeCity.index, 2)}`;
  els.infoPanel.innerHTML = state.selected ? renderQuarterPanel(state.selected) : renderCityPanel(cityScore);
  animateInfoPanel(previousValues, nextValues);
  state.panelValues = nextValues;
}

function panelAnimationValues(cityScore) {
  const metricFormats = [
    { digits: 2, type: "number" },
    { digits: 2, type: "number" },
    { digits: 0, type: "int" },
    { digits: 0, type: "int" }
  ];
  if (state.selected) {
    const props = state.selected.properties;
    return {
      metricFormats,
      metrics: [props.currentScore, props.baseScore, props.baseRank, props.population],
      bars: BLOCKS.map((block) => {
        const value = props.blocks ? props.blocks[block.key] : null;
        return value == null ? null : value * 100;
      })
    };
  }
  const city = state.activeCity;
  const cityBars = cityBlockScores();
  return {
    metricFormats,
    metrics: [cityScore, city.index, city.rank, city.population],
    bars: BLOCKS.map((block) => cityBars[block.key])
  };
}

function animateInfoPanel(previousValues, nextValues) {
  const metricNodes = [...els.infoPanel.querySelectorAll(".metric strong")];
  metricNodes.forEach((node, index) => {
    const startValue = previousValues && previousValues.metrics ? previousValues.metrics[index] : undefined;
    animateNumberNode(node, startValue, nextValues.metrics[index], nextValues.metricFormats[index]);
  });

  const fillNodes = [...els.infoPanel.querySelectorAll(".barFill")];
  fillNodes.forEach((node, index) => {
    const target = normalizedBarValue(nextValues.bars[index]);
    const previousBar = previousValues && previousValues.bars ? previousValues.bars[index] : undefined;
    const start = normalizedBarValue(previousBar != null ? previousBar : target);
    node.style.width = `${start}%`;
    requestAnimationFrame(() => {
      if (node.isConnected) node.style.width = `${target}%`;
    });
  });

  const barValueNodes = [...els.infoPanel.querySelectorAll(".barRow > strong")];
  barValueNodes.forEach((node, index) => {
    const previousBar = previousValues && previousValues.bars ? previousValues.bars[index] : undefined;
    animateNumberNode(node, previousBar, nextValues.bars[index], { digits: 0, type: "number" });
  });
}

function normalizedBarValue(value) {
  return Number.isFinite(value) ? clamp(value, 0, 100) : 0;
}

function animateNumberNode(node, startValue, targetValue, format) {
  if (!Number.isFinite(targetValue)) {
    node.textContent = formatNumber(targetValue, format && format.digits != null ? format.digits : 0);
    return;
  }
  if (!Number.isFinite(startValue)) {
    node.textContent = formatAnimatedValue(targetValue, format);
    return;
  }
  if (Math.abs(startValue - targetValue) < 0.01) {
    node.textContent = formatAnimatedValue(targetValue, format);
    return;
  }
  const startedAt = performance.now();
  const duration = 1150;
  const from = startValue;
  const delta = targetValue - startValue;
  const tick = (now) => {
    if (!node.isConnected) return;
    const t = clamp((now - startedAt) / duration, 0, 1);
    const eased = 0.5 - Math.cos(Math.PI * t) / 2;
    node.textContent = formatAnimatedValue(from + delta * eased, format);
    if (t < 1) requestAnimationFrame(tick);
    else node.textContent = formatAnimatedValue(targetValue, format);
  };
  node.textContent = formatAnimatedValue(startValue, format);
  requestAnimationFrame(tick);
}

// @dist-split
function formatAnimatedValue(value, format = {}) {
  if (format.type === "int") return formatInt(Math.round(value));
  return formatNumber(value, format.digits != null ? format.digits : 0);
}

function renderCityPanel(cityScore) {
  const city = state.activeCity;
  return `
    <button class="sheetHandle" type="button" aria-label="Свернуть или раскрыть панель"></button>
    <div class="panelTitle">
      <h2>${city.name}</h2>
      <span class="muted">#${city.rank}</span>
    </div>
    <div class="metricGrid">
      <div class="metric"><strong>${formatNumber(cityScore, 2)}</strong><span>Сценарный индекс</span></div>
      <div class="metric"><strong>${formatNumber(city.index, 2)}</strong><span>Основной индекс</span></div>
      <div class="metric"><strong>${formatInt(city.rank)}</strong><span>Ранг</span></div>
      <div class="metric"><strong>${formatInt(city.population)}</strong><span>Численность населения</span></div>
    </div>
    ${renderBars(cityBlockScores())}
  `;
}

function renderQuarterPanel(feature) {
  const props = feature.properties;
  return `
    <button class="sheetHandle" type="button" aria-label="Свернуть или раскрыть панель"></button>
    <div class="panelTitle">
      <h2>Квартал ${props.id}</h2>
      <span class="muted">#${props.currentRank != null ? props.currentRank : "—"}</span>
    </div>
    <div class="metricGrid">
      <div class="metric"><strong>${formatNumber(props.currentScore, 2)}</strong><span>Сценарный индекс</span></div>
      <div class="metric"><strong>${formatNumber(props.baseScore, 2)}</strong><span>Основной индекс</span></div>
      <div class="metric"><strong>${formatNumber(props.baseRank, 0)}</strong><span>Ранг</span></div>
      <div class="metric"><strong>${formatInt(props.population)}</strong><span>Численность населения</span></div>
    </div>
    ${renderBars(blockScoreValues(props.blocks))}
    ${renderGroupedIndicators(props.indicators || [])}
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
              <h3 title="${escapeAttr(GROUP_HELP[group] || "")}">${group}</h3>
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
        const value = values ? values[block.key] : undefined;
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

function blockScoreValues(blocks) {
  const result = {};
  for (const block of BLOCKS) {
    const value = blocks ? blocks[block.key] : null;
    result[block.key] = value == null ? null : value * 100;
  }
  return result;
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
    help: "Исходный показатель квартала, используемый при нормализации и расчёте субиндекса."
  };
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

// @dist-split
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

function worldViewBbox() {
  const rect = overlayCanvas.getBoundingClientRect();
  return bboxFromPoints([
    screenToWorld(-120, -120),
    screenToWorld(rect.width + 120, -120),
    screenToWorld(rect.width + 120, rect.height + 120),
    screenToWorld(-120, rect.height + 120)
  ]);
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

function bboxIntersects(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function depthOf(feature) {
  const sin = Math.sin(state.camera.bearing);
  const cos = Math.cos(state.camera.bearing);
  return feature.center[0] * sin + feature.center[1] * cos;
}

function scoreColor(score, alpha = 1) {
  const stops = [
    [0, [168, 61, 75]],
    [35, [217, 120, 66]],
    [55, [223, 189, 84]],
    [72, [118, 173, 112]],
    [100, [45, 123, 120]]
  ];
  const value = clamp(score != null ? score : 0, 0, 100);
  let left = stops[0];
  let right = stops[stops.length - 1];
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

function escapeAttr(value) {
  return String(value != null ? value : "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

if (gl) {
  try {
    glState = initGl(gl);
  } catch (error) {
    console.error(error);
    gl = null;
  }
}

init();
