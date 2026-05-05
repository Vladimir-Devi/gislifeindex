const BLOCKS = [
  {
    key: "housing",
    label: "Жильё",
    color: "#256d72",
    help: "Обеспеченность жильём, плотность, этажность и износ жилого фонда"
  },
  {
    key: "infra",
    label: "Коммерческая инфраструктура",
    color: "#6f6c2d",
    help: "Разнообразие объектов инфраструктуры и полнота повседневной городской корзины"
  },
  {
    key: "transport",
    label: "Транспорт",
    color: "#316a9c",
    help: "Доступность остановок общественного транспорта для жителей квартала"
  },
  {
    key: "work",
    label: "Крупные работодатели",
    color: "#7b5796",
    help: "Обеспеченность квартала крупными организациями и плотность занятости"
  },
  {
    key: "green",
    label: "Зелёные зоны",
    color: "#477f5b",
    help: "Доступность зелёных территорий для жителей квартала"
  },
  {
    key: "commerce",
    label: "Экономика",
    color: "#b88624",
    help: "Экономическая активность по данным ФНС: ККТ, активность и чековые показатели"
  }
];

const LAYERS = [
  { key: "quartals", label: "Кварталы" },
  { key: "buildings", label: "Здания" },
  { key: "stops", label: "Остановки ОТ" },
  { key: "dtp", label: "ДТП" }
];

const INDICATOR_META = {
  "Жильё|плотность": { unit: "чел/га", help: "Плотность населения" },
  "Жильё|обеспеченность": { unit: "м²/чел", help: "Обеспеченность жилой площадью на одного жителя" },
  "Жильё|износ": { unit: "%", help: "Средневзвешенный износ многоквартирных домов" },
  "Жильё|этажность": { unit: "этажей", help: "Средняя этажность многоквартирных домов" },
  "Коммерческая инфраструктура|разнообразие": { unit: "0-1", help: "Разнообразие объектов коммерческой инфраструктуры" },
  "Коммерческая инфраструктура|полнота корзины": { unit: "%", help: "Доля базовой городской корзины, доступной жителям квартала" },
  "Транспорт|доступность": { unit: "%", help: "Доля населения в 5-минутной зоне доступности остановок ОТ" },
  "Крупные работодатели|обеспеченность": { unit: "коэф.", help: "Коэффициент обеспеченности крупными работодателями" },
  "Крупные работодатели|плотность": { unit: "ед./м²", help: "Плотность рабочих мест крупных организаций" },
  "Зелёные зоны|доступность": { unit: "%", help: "Доля жителей в 5-минутной зоне доступности зелёных зон" },
  "Экономика|активность ФНС": { unit: "0-10", help: "Оценка экономической активности по данным ФНС" },
  "Экономика|ККТ": { unit: "ед.", help: "Число единиц контрольно-кассовых терминалов" },
  "Экономика|медианный чек": { unit: "руб.", help: "Медианный чек коммерческих операций" }
};

const GROUP_HELP = {
  "Жильё": BLOCKS.find((block) => block.key === "housing").help,
  "Коммерческая инфраструктура": BLOCKS.find((block) => block.key === "infra").help,
  "Транспорт": BLOCKS.find((block) => block.key === "transport").help,
  "Крупные работодатели": BLOCKS.find((block) => block.key === "work").help,
  "Зелёные зоны": BLOCKS.find((block) => block.key === "green").help,
  "Зеленые зоны": BLOCKS.find((block) => block.key === "green").help,
  "Экономика": BLOCKS.find((block) => block.key === "commerce").help
};

const DETAIL_FACTOR = 4.75;
const BUILDING_DETAIL_REQUEST_FACTOR = 4.25;
const BUILDING_DETAIL_FADE_START_FACTOR = 4.55;
const BUILDING_DETAIL_FADE_FULL_FACTOR = 5.25;
const BUILDING_OVERVIEW_FADE_DELAY = 0.18;
const ROAD_DETAIL_FACTOR = 11.8;
const ROAD_DETAIL_REQUEST_FACTOR = 11.4;
const ROAD_DETAIL_FULL_FACTOR = 14;
const ROAD_SURFACE_OFFSET = 0;
const RAILWAY_SURFACE_OFFSET = 0;
const BUILDING_FADE_FACTOR = 5.35;
const MOBILE_BUILDING_FADE_FACTOR = 3.8;
const MOBILE_BUILDING_MIN_ALPHA = 0.08;
const SMALL_NON_RESIDENTIAL_FULL_FACTOR = 15;
const PACKED_VERTEX_BYTES = 8;
const HEIGHT_EXAGGERATION = 1.33;
const TERRAIN_VERTICAL_EXAGGERATION = 1.35;
const DATA_VERSION = "20260505-1215";
const MOBILE_NON_RESIDENTIAL_FACTOR = 11.8;
const SMALL_NON_RESIDENTIAL_FACTOR = 13.4;
const MOBILE_SMALL_NON_RESIDENTIAL_FACTOR = 15;
const MOBILE_SMALL_NON_RESIDENTIAL_FULL_FACTOR = 16;
const CAMERA_TUTORIAL_KEY = "lifeindex.cameraTutorialSeen";
const THEME_STORAGE_KEY = "lifeindex.theme";
const CAMERA_MIN_ZOOM_FACTOR = 0.58;
const CAMERA_MAX_ZOOM_FACTOR = 16;
const CAMERA_MIN_PITCH = 0.34;
const CAMERA_MAX_PITCH = 1.46;

const CANVAS_THEMES = {
  light: {
    mapBg: "#e7e0d3",
    grid: "rgba(94, 91, 84, 0.085)",
    waterFill: "rgba(87, 145, 176, 0.44)",
    waterStroke: "rgba(54, 106, 138, 0.32)",
    greenFill: "rgba(80, 130, 78, 0.34)",
    greenStroke: "rgba(61, 92, 58, 0.2)",
    quarterStroke: "rgba(64, 66, 62, 0.42)",
    roadDetail: (alpha) => `rgba(91, 96, 96, ${alpha})`,
    roadMain: (alpha) => `rgba(47, 54, 55, ${alpha})`,
    railway: (alpha) => `rgba(62, 61, 58, ${alpha})`,
    railwayDash: (alpha) => `rgba(244, 238, 226, ${Math.min(0.72, alpha + 0.18)})`,
    selectedFill: "rgba(255, 246, 199, 0.16)",
    selectedOuter: "rgba(30, 37, 40, 0.42)",
    selectedInner: "#1e2528",
    pointStroke: "#ffffff",
    accidentText: "#fffaf1"
  },
  dark: {
    mapBg: "#101617",
    grid: "rgba(220, 225, 213, 0.055)",
    waterFill: "rgba(55, 103, 128, 0.42)",
    waterStroke: "rgba(94, 152, 181, 0.28)",
    greenFill: "rgba(53, 104, 66, 0.36)",
    greenStroke: "rgba(111, 158, 99, 0.2)",
    quarterStroke: "rgba(214, 218, 206, 0.24)",
    roadDetail: (alpha) => `rgba(132, 129, 115, ${Math.min(0.38, alpha + 0.08)})`,
    roadMain: (alpha) => `rgba(178, 164, 135, ${Math.min(0.58, alpha + 0.08)})`,
    railway: (alpha) => `rgba(186, 181, 168, ${Math.min(0.62, alpha + 0.08)})`,
    railwayDash: (alpha) => `rgba(18, 24, 26, ${Math.min(0.82, alpha + 0.08)})`,
    selectedFill: "rgba(255, 222, 132, 0.12)",
    selectedOuter: "rgba(255, 238, 176, 0.36)",
    selectedInner: "#fff2bd",
    pointStroke: "#111719",
    accidentText: "#fffaf1"
  }
};

const state = {
  manifest: null,
  activeCity: null,
  data: null,
  theme: "light",
  comparisonMode: "city",
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
  pointLoadPromises: { stops: null, dtp: null },
  cameraAnimation: null,
  smoothZoom: null,
  cameraInertia: null,
  dragging: null,
  pulseFrame: null,
  overviewMesh: null,
  overviewMeshes: new Map(),
  loadingOverviewMeshes: new Set(),
  tileMeshes: new Map(),
  tileMeshModes: new Map(),
  smallTileMeshes: new Map(),
  roadTiles: new Map(),
  loadingTiles: new Set(),
  requestedTiles: new Set(),
  panelValues: null,
  sheetDrag: null,
  activePointers: new Map(),
  pinchGesture: null,
  lastGestureVelocity: null,
  suppressHandleClickUntil: 0,
  tooltipTarget: null,
  tooltipNode: null,
  renderToken: 0
};

const baseCanvas = document.getElementById("baseCanvas");
const overlayCanvas = document.getElementById("overlayCanvas");
const glCanvas = document.getElementById("glCanvas");
const baseCtx = baseCanvas.getContext("2d");
const overlayCtx = overlayCanvas.getContext("2d");
let gl = null;
gl = createWebGlContext(glCanvas);

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
  accidentPopup: document.getElementById("accidentPopup"),
  cameraTutorial: document.getElementById("cameraTutorial"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  themeToggle: document.getElementById("themeToggle")
};

let glState = null;
let activeDataVersion = DATA_VERSION;

function createWebGlContext(canvas) {
  const mobile = isMobileLayout();
  const optionSets = mobile
    ? [
        { alpha: true, antialias: false, depth: true, stencil: false, preserveDrawingBuffer: false, premultipliedAlpha: false, powerPreference: "default" },
        { alpha: true, antialias: false, preserveDrawingBuffer: false, premultipliedAlpha: false },
        { alpha: true, antialias: false }
      ]
    : [
        { alpha: true, antialias: true, depth: true, stencil: false, preserveDrawingBuffer: false, premultipliedAlpha: false, powerPreference: "high-performance" },
        { alpha: true, antialias: false, depth: true, stencil: false, preserveDrawingBuffer: false, premultipliedAlpha: false },
        { alpha: true, antialias: false }
      ];
  for (const options of optionSets) {
    for (const type of ["webgl2", "webgl", "experimental-webgl"]) {
      try {
        const context = canvas.getContext(type, options);
        if (context) return context;
      } catch (error) {
        console.warn(error);
      }
    }
  }
  return null;
}

// @dist-split
async function init() {
  state.manifest = fallbackManifest();
  initTheme();
  renderCityMenu();
  renderControls();
  renderLegend();
  initTooltip();
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
        population: 282314,
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
          terrain: "data3d/orel/terrain.json",
          stops: "data3d/orel/stops.json",
          dtp: "data3d/orel/dtp.json",
          buildingsOverviewBase: "data3d/orel/buildings-overview",
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
        population: 248808,
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
          terrain: "data3d/tambov/terrain.json",
          stops: "data3d/tambov/stops.json",
          dtp: "data3d/tambov/dtp.json",
          buildingsOverviewBase: "data3d/tambov/buildings-overview",
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
  const refreshKey = Date.now().toString(36);
  const candidates = [
    `data3d/manifest.json?v=${DATA_VERSION}&r=${refreshKey}`,
    `/data3d/manifest.json?v=${DATA_VERSION}&r=${refreshKey}`,
    `data3d/manifest.json?r=${refreshKey}`,
    `/data3d/manifest.json?r=${refreshKey}`
  ];
  let lastError = null;
  for (const url of candidates) {
    try {
      const manifest = await fetchJson(url);
      activeDataVersion = dataVersionFromManifest(manifest) || DATA_VERSION;
      return manifest;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function dataVersionFromManifest(manifest) {
  const generatedAt = String(manifest?.generatedAt || "");
  return generatedAt.replace(/\D/g, "").slice(0, 14);
}

function versionedDataUrl(url) {
  if (!url || url.includes("?") || /^(https?:|data:|blob:)/.test(url)) return url;
  const [path, hash = ""] = url.split("#");
  return `${path}?v=${activeDataVersion}${hash ? `#${hash}` : ""}`;
}

async function fetchJson(url) {
  const requestUrl = versionedDataUrl(url);
  const response = await fetch(requestUrl);
  if (!response.ok) throw new Error(`Не удалось загрузить ${requestUrl}`);
  return response.json();
}

async function fetchArrayBuffer(url) {
  const requestUrl = versionedDataUrl(url);
  const response = await fetch(requestUrl);
  if (!response.ok) throw new Error(`Не удалось загрузить ${requestUrl}`);
  return response.arrayBuffer();
}

async function fetchMeshArrayBuffer(url) {
  if (typeof DecompressionStream === "function") {
    try {
      return await decompressGzip(await fetchArrayBuffer(`${url}.gz`));
    } catch (error) {
      console.warn(error);
    }
  }
  return fetchArrayBuffer(url);
}

async function decompressGzip(buffer) {
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

function decodeTerrain(payload) {
  if (!payload || !payload.width || !payload.height || !Array.isArray(payload.h)) return null;
  return {
    ...payload,
    h: new Float32Array(payload.h.map((value) => (value / (payload.scale || 1)) * TERRAIN_VERTICAL_EXAGGERATION))
  };
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
          </dl>
          ${renderQualityStructure(city)}
        </article>`
    )
    .join("");

  for (const card of els.cityMenu.querySelectorAll(".cityCard")) {
    card.addEventListener("click", () => loadCity(card.dataset.city));
    card.addEventListener("pointermove", updateCityCardTilt);
    card.addEventListener("pointerleave", resetCityCardTilt);
  }
}

function renderQualityStructure(city) {
  const low = clamp((city.lowShare || 0) * 100, 0, 100);
  const mid = clamp((city.midShare || 0) * 100, 0, 100);
  const high = clamp((city.highShare || 0) * 100, 0, 100);
  return `
    <div class="qualityMix" aria-label="Структура населения по качеству среды">
      <div class="qualityTitle">Структура населения по качеству среды:</div>
      <div class="qualityBar">
        <span class="qualityBad" style="width:${low}%"></span>
        <span class="qualityMid" style="width:${mid}%"></span>
        <span class="qualityGood" style="width:${high}%"></span>
      </div>
      <div class="qualityLegend">
        <span><i class="qualityDot bad"></i>Плохая ${formatNumber(low, 1)}%</span>
        <span><i class="qualityDot mid"></i>Средняя ${formatNumber(mid, 1)}%</span>
        <span><i class="qualityDot good"></i>Хорошая ${formatNumber(high, 1)}%</span>
      </div>
    </div>`;
}

function updateCityCardTilt(event) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const mx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const my = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  const rotateX = (0.5 - my) * 11;
  const rotateY = (mx - 0.5) * 14;
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
  const collapsed = isMobileLayout();
  els.scenarioControls.innerHTML = `
    <button class="controlPanelTitle" type="button" aria-expanded="${collapsed ? "false" : "true"}">Сценарии индекса</button>
    <div class="controlPanelBody">
      ${BLOCKS.map(
    (block) => `
      <label class="toggle" data-tooltip="${escapeAttr(block.help)}">
        <input type="checkbox" data-block="${block.key}" checked />
        ${block.label}
      </label>`
      ).join("")}
    </div>`;

  els.layerControls.innerHTML = `
    <button class="controlPanelTitle" type="button" aria-expanded="${collapsed ? "false" : "true"}">Слои</button>
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
    panel.classList.toggle("collapsed", collapsed);
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
    const layer = input.dataset.layer;
    state.layers[layer] = input.checked;
    if (!state.layers.dtp) state.accidentPopup = null;
    if (input.checked && (layer === "stops" || layer === "dtp")) {
      ensurePointLayer(layer).then(() => {
        if (state.layers[layer]) draw();
      });
    }
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

function renderCameraTutorial() {
  if (!els.cameraTutorial) return;
  if (safeLocalStorageGet(CAMERA_TUTORIAL_KEY) === "1") {
    els.cameraTutorial.classList.add("hidden");
    return;
  }
  els.cameraTutorial.classList.remove("hidden");
  els.cameraTutorial.innerHTML = `
    <button class="tutorialClose" type="button" aria-label="Закрыть обучение">×</button>
    <strong>Управление картой</strong>
    <div class="tutorialGrid">
      <span>ЛКМ</span><p>двигать карту</p>
      <span>ПКМ</span><p>поворот и наклон</p>
      <span>Колесо</span><p>плавный зум</p>
      <span>Сенсор</span><p>один палец двигает, два пальца масштабируют и вращают</p>
    </div>
  `;
}

function hideCameraTutorial(persist = true) {
  if (!els.cameraTutorial) return;
  els.cameraTutorial.classList.add("hidden");
  if (persist) safeLocalStorageSet(CAMERA_TUTORIAL_KEY, "1");
}

function safeLocalStorageGet(key) {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // localStorage can be blocked in some private browsing modes.
  }
}

function initTheme() {
  setTheme(safeLocalStorageGet(THEME_STORAGE_KEY) === "dark" ? "dark" : "light", false);
}

function setTheme(theme, persist = true) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  state.theme = nextTheme;
  if (nextTheme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  if (els.themeToggle) {
    const isDark = nextTheme === "dark";
    els.themeToggle.setAttribute("aria-pressed", String(isDark));
    els.themeToggle.setAttribute("aria-label", isDark ? "Светлая тема" : "Ночная тема");
    els.themeToggle.title = isDark ? "Светлая тема" : "Ночная тема";
    els.themeToggle.textContent = isDark ? "☼" : "◐";
  }
  if (persist) safeLocalStorageSet(THEME_STORAGE_KEY, nextTheme);
  if (state.data) draw();
}

function toggleTheme() {
  setTheme(state.theme === "dark" ? "light" : "dark");
}

function initTooltip() {
  if (state.tooltipNode) return;
  const node = document.createElement("div");
  node.className = "uiTooltip hidden";
  document.body.appendChild(node);
  state.tooltipNode = node;

  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("[data-tooltip]");
    if (!target || !target.dataset.tooltip) return;
    state.tooltipTarget = target;
    node.textContent = target.dataset.tooltip;
    node.classList.remove("hidden");
    positionTooltip(event);
  });
  document.addEventListener("pointermove", (event) => {
    if (state.tooltipTarget) positionTooltip(event);
  });
  document.addEventListener("pointerout", (event) => {
    if (!state.tooltipTarget) return;
    if (event.relatedTarget && state.tooltipTarget.contains(event.relatedTarget)) return;
    hideTooltip();
  });
  document.addEventListener("keydown", hideTooltip);
}

function positionTooltip(event) {
  const node = state.tooltipNode;
  if (!node) return;
  const margin = 12;
  const offset = 16;
  const rect = node.getBoundingClientRect();
  let x = event.clientX + offset;
  let y = event.clientY + offset;
  if (x + rect.width + margin > window.innerWidth) x = event.clientX - rect.width - offset;
  if (y + rect.height + margin > window.innerHeight) y = event.clientY - rect.height - offset;
  node.style.left = `${Math.max(margin, x)}px`;
  node.style.top = `${Math.max(margin, y)}px`;
}

function hideTooltip() {
  state.tooltipTarget = null;
  if (state.tooltipNode) state.tooltipNode.classList.add("hidden");
}

// @dist-split
function attachEvents() {
  window.addEventListener("resize", resizeCanvases);
  overlayCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
  els.backButton.addEventListener("click", showCityMenu);
  els.themeToggle?.addEventListener("click", toggleTheme);
  document.getElementById("resetView").addEventListener("click", resetView);
  els.cameraTutorial?.addEventListener("click", (event) => {
    if (event.target.closest(".tutorialClose")) hideCameraTutorial(true);
  });
  els.infoPanel.addEventListener("pointerdown", startSheetDrag);
  els.infoPanel.addEventListener("pointermove", moveSheetDrag);
  els.infoPanel.addEventListener("pointerup", endSheetDrag);
  els.infoPanel.addEventListener("pointercancel", endSheetDrag);
  els.accidentPopup.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });
  els.accidentPopup.addEventListener("pointerdown", (event) => event.stopPropagation());
  els.accidentPopup.addEventListener("pointermove", (event) => event.stopPropagation());
  els.accidentPopup.addEventListener("touchmove", (event) => event.stopPropagation(), { passive: true });
  els.infoPanel.addEventListener("click", (event) => {
    const comparisonToggle = event.target.closest("[data-comparison-toggle]");
    if (comparisonToggle) {
      state.comparisonMode = state.comparisonMode === "city" ? "all" : "city";
      recomputeScores();
      updatePanel();
      draw();
      return;
    }
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
      startWorld: screenToWorldOnTerrain(...eventCanvasPoint(event)),
      startBearing: state.camera.bearing,
      startPitch: state.camera.pitch,
      lastTime: performance.now(),
      lastCenter: [...state.camera.center],
      lastBearing: state.camera.bearing,
      lastPitch: state.camera.pitch,
      velocity: null
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
      const previousBearing = state.camera.bearing;
      const previousPitch = state.camera.pitch;
      const dx = event.clientX - state.dragging.x;
      const dy = event.clientY - state.dragging.y;
      state.camera.bearing = state.dragging.startBearing + dx * 0.006;
      state.camera.pitch = clamp(state.dragging.startPitch - dy * 0.004, CAMERA_MIN_PITCH, CAMERA_MAX_PITCH);
      recordDragVelocity({
        center: [0, 0],
        bearing: state.camera.bearing - previousBearing,
        pitch: state.camera.pitch - previousPitch
      });
      draw();
      return;
    }
    const previousCenter = [...state.camera.center];
    const current = screenToWorldOnTerrain(...eventCanvasPoint(event));
    state.camera.center[0] += state.dragging.startWorld[0] - current[0];
    state.camera.center[1] += state.dragging.startWorld[1] - current[1];
    clampCameraCenter();
    recordDragVelocity({
      center: [state.camera.center[0] - previousCenter[0], state.camera.center[1] - previousCenter[1]],
      bearing: 0,
      pitch: 0
    });
    draw();
  });

  overlayCanvas.addEventListener("pointerup", (event) => {
    if (overlayCanvas.hasPointerCapture && overlayCanvas.hasPointerCapture(event.pointerId)) overlayCanvas.releasePointerCapture(event.pointerId);
    const wasPinching = Boolean(state.pinchGesture);
    forgetPointer(event.pointerId);
    if (wasPinching) {
      if (state.activePointers.size < 2) {
        state.pinchGesture = null;
        startCameraInertia(state.lastGestureVelocity);
        state.lastGestureVelocity = null;
      }
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
    const drag = state.dragging;
    state.dragging = null;
    if (wasPan && !moved) pickFeature(event);
    else if (moved) startCameraInertia(drag.velocity);
  });

  overlayCanvas.addEventListener("pointercancel", (event) => {
    forgetPointer(event.pointerId);
    state.pinchGesture = null;
    state.lastGestureVelocity = null;
    overlayCanvas.classList.remove("dragging");
    overlayCanvas.classList.remove("orbiting");
    state.dragging = null;
  });

  overlayCanvas.addEventListener(
    "wheel",
    (event) => {
      if (!state.data) return;
      event.preventDefault();
      const rect = overlayCanvas.getBoundingClientRect();
      const cursor = [event.clientX - rect.left, event.clientY - rect.top];
      smoothZoomAtCursor(cursor, event.deltaY);
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

function eventCanvasPoint(event) {
  const rect = overlayCanvas.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top];
}

function recordDragVelocity(delta) {
  if (!state.dragging) return;
  const now = performance.now();
  const dt = Math.max(16, now - state.dragging.lastTime);
  state.dragging.velocity = {
    center: [delta.center[0] / dt, delta.center[1] / dt],
    bearing: delta.bearing / dt,
    pitch: delta.pitch / dt,
    scale: 0,
    time: now
  };
  state.dragging.lastTime = now;
  state.dragging.lastCenter = [...state.camera.center];
  state.dragging.lastBearing = state.camera.bearing;
  state.dragging.lastPitch = state.camera.pitch;
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
    startAngle: pinchAngle(pointers),
    startMidpoint: midpoint,
    startScale: state.camera.scale,
    startBearing: state.camera.bearing,
    startPitch: state.camera.pitch,
    startWorld: screenToWorldOnTerrain(midpoint[0], midpoint[1]),
    lastTime: performance.now()
  };
  state.lastGestureVelocity = null;
}

function updatePinchGesture() {
  const pointers = pinchPointers();
  if (!pointers || !state.pinchGesture) return;
  const previousCenter = [...state.camera.center];
  const previousScale = state.camera.scale;
  const previousBearing = state.camera.bearing;
  const previousPitch = state.camera.pitch;
  const midpoint = pinchMidpoint(pointers);
  const factor = pinchDistance(pointers) / state.pinchGesture.startDistance;
  const angleDelta = normalizeAngleDelta(pinchAngle(pointers) - state.pinchGesture.startAngle);
  const midpointDy = midpoint[1] - state.pinchGesture.startMidpoint[1];
  state.camera.scale = clamp(
    state.pinchGesture.startScale * factor,
    cameraMinScale(),
    cameraMaxScale()
  );
  state.camera.bearing = state.pinchGesture.startBearing - angleDelta;
  state.camera.pitch = clamp(state.pinchGesture.startPitch - midpointDy * 0.0038, CAMERA_MIN_PITCH, CAMERA_MAX_PITCH);
  const after = screenToWorldOnTerrain(midpoint[0], midpoint[1]);
  state.camera.center[0] += state.pinchGesture.startWorld[0] - after[0];
  state.camera.center[1] += state.pinchGesture.startWorld[1] - after[1];
  clampCameraCenter();
  const now = performance.now();
  const dt = Math.max(16, now - state.pinchGesture.lastTime);
  state.lastGestureVelocity = {
    center: [(state.camera.center[0] - previousCenter[0]) / dt, (state.camera.center[1] - previousCenter[1]) / dt],
    bearing: normalizeAngleDelta(state.camera.bearing - previousBearing) / dt,
    pitch: (state.camera.pitch - previousPitch) / dt,
    scale: Math.log(Math.max(state.camera.scale, 0.0001) / Math.max(previousScale, 0.0001)) / dt,
    time: now
  };
  state.pinchGesture.lastTime = now;
  draw();
}

function pinchDistance(pointers) {
  return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
}

function pinchAngle(pointers) {
  return Math.atan2(pointers[1].y - pointers[0].y, pointers[1].x - pointers[0].x);
}

function normalizeAngleDelta(value) {
  let delta = value;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
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
  if (event.target.closest("[data-comparison-toggle]")) return;
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

const LOADING_STAGES = [
  { key: "quartals", label: "Загружаю кварталы" },
  { key: "layers", label: "Загружаю слои" },
  { key: "buildings", label: "Загружаю здания" },
  { key: "prepare", label: "Готовлю 3D" }
];

function showLoadingOverlay(cityName) {
  if (!els.loadingOverlay) return;
  els.loadingOverlay.classList.remove("hidden");
  els.loadingOverlay.innerHTML = `
    <div class="loadingCard" role="status" aria-live="polite">
      <div class="loadingTitle">${cityName}</div>
      <div class="loadingSteps">
        ${LOADING_STAGES.map((stage) => `
          <div class="loadingStep" data-stage="${stage.key}">
            <span></span>
            <p>${stage.label}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function setLoadingStage(key, status = "active") {
  if (!els.loadingOverlay) return;
  const currentIndex = LOADING_STAGES.findIndex((stage) => stage.key === key);
  for (const node of els.loadingOverlay.querySelectorAll(".loadingStep")) {
    const stageIndex = LOADING_STAGES.findIndex((stage) => stage.key === node.dataset.stage);
    node.classList.toggle("done", stageIndex < currentIndex || (node.dataset.stage === key && status === "done"));
    node.classList.toggle("active", node.dataset.stage === key && status === "active");
    node.classList.toggle("error", node.dataset.stage === key && status === "error");
  }
}

function hideLoadingOverlay() {
  if (!els.loadingOverlay) return;
  els.loadingOverlay.classList.add("hidden");
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
  state.comparisonMode = "city";
  state.accidentPopup = null;
  state.panelValues = null;
  els.title.textContent = city.name;
  els.topMetric.textContent = `Индекс ${formatNumber(city.index, 2)} · ${formatInt(city.population)} жителей`;
  els.cityMenu.classList.add("hidden");
  els.mapShell.classList.remove("hidden");
  els.backButton.classList.remove("hidden");
  renderCameraTutorial();
  els.infoPanel.classList.remove("sheetExpanded");
  els.infoPanel.innerHTML = `<div class="muted">Загрузка 3D-данных</div>`;
  showLoadingOverlay(city.name);

  try {
    setLoadingStage("quartals");
    const quartals = await fetchJson(city.files3d.quartals);
    if (token !== state.renderToken) return;
    setLoadingStage("quartals", "done");

    setLoadingStage("layers");
    const [green, water, roads, railways, terrain] = await Promise.all([
      fetchJson(city.files3d.green),
      fetchJson(city.files3d.water),
      fetchJson(city.files3d.roads),
      fetchJson(city.files3d.railways),
      city.files3d.terrain ? fetchJson(city.files3d.terrain).catch(() => null) : Promise.resolve(null)
    ]);
    if (token !== state.renderToken) return;
    setLoadingStage("layers", "done");

    setLoadingStage("buildings");
    const overviewMode = initialBuildingMeshMode();
    const overviewMesh = await loadOverviewMeshForCity(city, overviewMode);
    if (token !== state.renderToken) return;
    setLoadingStage("buildings", "done");

    setLoadingStage("prepare");
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
      terrain: decodeTerrain(terrain),
      points: { stops: [], dtp: [] },
      pointLayersLoaded: { stops: false, dtp: false }
    };

    state.pointLoadPromises = { stops: null, dtp: null };
    if (overviewMesh) {
      state.overviewMesh = overviewMesh;
      state.overviewMeshes.set(overviewMode, overviewMesh);
    }
    resizeCanvases();
    resetView();
    recomputeScores();
    updatePanel();
    draw();
    setLoadingStage("prepare", "done");
    setTimeout(() => {
      if (token === state.renderToken) hideLoadingOverlay();
    }, 220);
  } catch (error) {
    console.error(error);
    if (token !== state.renderToken) return;
    setLoadingStage("prepare", "error");
    els.infoPanel.innerHTML = `<div class="muted">Не удалось загрузить 3D-данные</div>`;
  }
}

async function ensurePointLayer(layer) {
  if (!state.activeCity || !state.data || (layer !== "stops" && layer !== "dtp")) return;
  if (state.data.pointLayersLoaded?.[layer]) return;
  if (state.pointLoadPromises[layer]) return state.pointLoadPromises[layer];
  const city = state.activeCity;
  const token = state.renderToken;
  const url = city.files3d[layer] || city.files3d.points;
  if (!url) return;
  state.pointLoadPromises[layer] = fetchJson(url)
    .then((payload) => {
      if (token !== state.renderToken || !state.data) return;
      const items = Array.isArray(payload) ? payload : payload.items || payload[layer] || [];
      state.data.points[layer] = items;
      state.data.pointLayersLoaded[layer] = true;
      if (layer === "dtp") state.accidentDisplayItems = [];
    })
    .catch((error) => {
      console.error(error);
      if (state.layers[layer]) state.layers[layer] = false;
    })
    .finally(() => {
      state.pointLoadPromises[layer] = null;
    });
  return state.pointLoadPromises[layer];
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
  hideLoadingOverlay();
  els.title.textContent = "Города исследования";
  els.topMetric.textContent = "";
  els.mapShell.classList.add("hidden");
  els.backButton.classList.add("hidden");
  els.cameraTutorial?.classList.add("hidden");
  els.cityMenu.classList.remove("hidden");
}

function clearMeshes() {
  stopCameraAnimation();
  if (gl) {
    const meshes = new Set(
      [...state.tileMeshes.values(), ...state.smallTileMeshes.values(), ...state.overviewMeshes.values(), state.overviewMesh].filter(Boolean)
    );
    for (const mesh of meshes) {
      if (mesh?.buffer) gl.deleteBuffer(mesh.buffer);
    }
  }
  state.overviewMesh = null;
  state.overviewMeshes.clear();
  state.loadingOverviewMeshes.clear();
  state.tileMeshes.clear();
  state.tileMeshModes.clear();
  state.smallTileMeshes.clear();
  state.roadTiles.clear();
  state.loadingTiles.clear();
  state.requestedTiles.clear();
  state.pointLoadPromises = { stops: null, dtp: null };
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
  const ratio = canvasPixelRatio();
  for (const canvas of [baseCanvas, overlayCanvas, glCanvas]) {
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
  }
  baseCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  overlayCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (gl) gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  if (state.data) draw();
}

function canvasPixelRatio() {
  const ratio = window.devicePixelRatio || 1;
  return isMobileLayout() ? Math.min(ratio, 1.5) : Math.min(ratio, 2);
}

function resetView() {
  if (!state.data) return;
  stopCameraAnimation();
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
  clampCameraCenter();
  draw();
}

function cameraMinScale() {
  return state.camera.fitScale * CAMERA_MIN_ZOOM_FACTOR;
}

function cameraMaxScale() {
  return state.camera.fitScale * CAMERA_MAX_ZOOM_FACTOR;
}

function clampCameraCenter() {
  if (!state.data?.bbox) return { x: false, y: false };
  const [minX, minY, maxX, maxY] = state.data.bbox;
  const previousX = state.camera.center[0];
  const previousY = state.camera.center[1];
  state.camera.center[0] = clamp(previousX, minX, maxX);
  state.camera.center[1] = clamp(previousY, minY, maxY);
  return {
    x: state.camera.center[0] !== previousX,
    y: state.camera.center[1] !== previousY
  };
}

function smoothZoomAtCursor(cursor, deltaY) {
  if (!state.data) return;
  stopProgrammaticCameraAnimation();
  stopCameraInertia();
  const baseTarget = state.smoothZoom?.targetScale ?? state.camera.scale;
  const factor = Math.exp(-clamp(deltaY, -260, 260) * 0.00145);
  const targetScale = clamp(baseTarget * factor, cameraMinScale(), cameraMaxScale());
  state.smoothZoom = {
    cursor,
    anchor: screenToWorldOnTerrain(cursor[0], cursor[1]),
    targetScale,
    lastTime: performance.now(),
    frame: state.smoothZoom?.frame ?? null
  };
  if (!state.smoothZoom.frame) {
    state.smoothZoom.frame = requestAnimationFrame(tickSmoothZoom);
  }
}

function tickSmoothZoom(time) {
  const zoom = state.smoothZoom;
  if (!zoom || !state.data) {
    state.smoothZoom = null;
    return;
  }
  const dt = Math.min(48, Math.max(8, time - zoom.lastTime));
  zoom.lastTime = time;
  const eased = 1 - Math.exp(-dt / 135);
  state.camera.scale += (zoom.targetScale - state.camera.scale) * eased;
  state.camera.scale = clamp(state.camera.scale, cameraMinScale(), cameraMaxScale());
  const after = screenToWorldOnTerrain(zoom.cursor[0], zoom.cursor[1]);
  state.camera.center[0] += zoom.anchor[0] - after[0];
  state.camera.center[1] += zoom.anchor[1] - after[1];
  clampCameraCenter();
  draw();
  if (Math.abs(Math.log(zoom.targetScale / state.camera.scale)) > 0.002) {
    zoom.frame = requestAnimationFrame(tickSmoothZoom);
    return;
  }
  state.camera.scale = zoom.targetScale;
  const finalAfter = screenToWorldOnTerrain(zoom.cursor[0], zoom.cursor[1]);
  state.camera.center[0] += zoom.anchor[0] - finalAfter[0];
  state.camera.center[1] += zoom.anchor[1] - finalAfter[1];
  clampCameraCenter();
  state.smoothZoom = null;
  draw();
}

function startCameraInertia(velocity) {
  if (!velocity || !state.data || !hasMeaningfulInertia(velocity)) return;
  if (velocity.time && performance.now() - velocity.time > 140) return;
  stopProgrammaticCameraAnimation();
  stopSmoothZoom();
  stopCameraInertia();
  state.cameraInertia = {
    velocity: {
      center: limitVector([(velocity.center?.[0] || 0) * 0.55, (velocity.center?.[1] || 0) * 0.55], 24),
      bearing: clamp((velocity.bearing || 0) * 0.62, -0.006, 0.006),
      pitch: clamp((velocity.pitch || 0) * 0.62, -0.004, 0.004),
      scale: clamp((velocity.scale || 0) * 0.5, -0.0035, 0.0035)
    },
    lastTime: performance.now(),
    frame: requestAnimationFrame(tickCameraInertia)
  };
}

function tickCameraInertia(time) {
  const inertia = state.cameraInertia;
  if (!inertia || !state.data) {
    state.cameraInertia = null;
    return;
  }
  const dt = Math.min(42, Math.max(8, time - inertia.lastTime));
  inertia.lastTime = time;
  const velocity = inertia.velocity;
  state.camera.center[0] += velocity.center[0] * dt;
  state.camera.center[1] += velocity.center[1] * dt;
  const clamped = clampCameraCenter();
  if (clamped.x) velocity.center[0] = 0;
  if (clamped.y) velocity.center[1] = 0;
  state.camera.bearing += velocity.bearing * dt;
  state.camera.pitch = clamp(state.camera.pitch + velocity.pitch * dt, CAMERA_MIN_PITCH, CAMERA_MAX_PITCH);
  if (velocity.scale) {
    state.camera.scale = clamp(state.camera.scale * Math.exp(velocity.scale * dt), cameraMinScale(), cameraMaxScale());
  }
  const decay = Math.exp(-dt / 260);
  velocity.center[0] *= decay;
  velocity.center[1] *= decay;
  velocity.bearing *= decay;
  velocity.pitch *= decay;
  velocity.scale *= decay;
  draw();
  if (hasMeaningfulInertia(velocity)) {
    inertia.frame = requestAnimationFrame(tickCameraInertia);
  } else {
    state.cameraInertia = null;
  }
}

function hasMeaningfulInertia(velocity) {
  const centerSpeed = Math.hypot(velocity.center?.[0] || 0, velocity.center?.[1] || 0);
  return (
    centerSpeed > 0.015 ||
    Math.abs(velocity.bearing || 0) > 0.000015 ||
    Math.abs(velocity.pitch || 0) > 0.000015 ||
    Math.abs(velocity.scale || 0) > 0.000015
  );
}

function limitVector(vector, maxLength) {
  const length = Math.hypot(vector[0], vector[1]);
  if (!Number.isFinite(length) || length <= maxLength) return vector;
  const factor = maxLength / length;
  return [vector[0] * factor, vector[1] * factor];
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
  const visualZ = z * HEIGHT_EXAGGERATION;
  return [rx, ry * pitchCos + visualZ * pitchSin, ry * pitchSin - visualZ * pitchCos];
}

function worldToScreen(x, y, z = 0) {
  const rect = overlayCanvas.getBoundingClientRect();
  const [tx, ty] = transformWorld(x, y, z);
  return [rect.width / 2 + tx * state.camera.scale, rect.height / 2 - ty * state.camera.scale];
}

function screenToWorld(sx, sy, z = 0) {
  const rect = overlayCanvas.getBoundingClientRect();
  const rx = (sx - rect.width / 2) / state.camera.scale;
  const projectedY = -((sy - rect.height / 2) / state.camera.scale);
  const visualZ = z * HEIGHT_EXAGGERATION;
  const ry = (projectedY - visualZ * Math.sin(state.camera.pitch)) / Math.cos(state.camera.pitch);
  const cos = Math.cos(state.camera.bearing);
  const sin = Math.sin(state.camera.bearing);
  return [
    state.camera.center[0] + rx * cos + ry * sin,
    state.camera.center[1] - rx * sin + ry * cos
  ];
}

function screenToWorldOnTerrain(sx, sy, offset = 0) {
  let world = screenToWorld(sx, sy, 0);
  for (let i = 0; i < 3; i += 1) {
    world = screenToWorld(sx, sy, terrainHeightAt(world[0], world[1]) + offset);
  }
  return world;
}

function draw() {
  if (!state.data) return;
  clampCameraCenter();
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
  const colors = canvasTheme();
  baseCtx.clearRect(0, 0, rect.width, rect.height);
  baseCtx.fillStyle = colors.mapBg;
  baseCtx.fillRect(0, 0, rect.width, rect.height);
  drawGrid(baseCtx, rect, colors);

  drawPolygonLayer(baseCtx, state.data.water, colors.waterFill, colors.waterStroke, 0);
  drawPolygonLayer(baseCtx, state.data.green, colors.greenFill, colors.greenStroke, 0);
  if (state.layers.quartals) drawQuartals(baseCtx);
  drawRailways(baseCtx);
  drawRoads(baseCtx);
}

function terrainGridHeight(terrain, col, row) {
  if (!terrain || col < 0 || row < 0 || col >= terrain.width || row >= terrain.height) return 0;
  return terrain.h[row * terrain.width + col] || 0;
}

function terrainHeightAt(x, y) {
  const terrain = state.data?.terrain;
  if (!terrain || !terrain.h?.length) return 0;
  const [minX, minY, maxX, maxY] = terrain.bbox;
  if (x < minX || x > maxX || y < minY || y > maxY) return 0;
  const col = ((x - minX) / (maxX - minX || 1)) * (terrain.width - 1);
  const row = ((maxY - y) / (maxY - minY || 1)) * (terrain.height - 1);
  const x0 = clamp(Math.floor(col), 0, terrain.width - 1);
  const y0 = clamp(Math.floor(row), 0, terrain.height - 1);
  const x1 = Math.min(terrain.width - 1, x0 + 1);
  const y1 = Math.min(terrain.height - 1, y0 + 1);
  const tx = col - x0;
  const ty = row - y0;
  const top = terrainGridHeight(terrain, x0, y0) * (1 - tx) + terrainGridHeight(terrain, x1, y0) * tx;
  const bottom = terrainGridHeight(terrain, x0, y1) * (1 - tx) + terrainGridHeight(terrain, x1, y1) * tx;
  return top * (1 - ty) + bottom * ty;
}

function drawGrid(ctx, rect, colors = canvasTheme()) {
  ctx.save();
  ctx.strokeStyle = colors.grid;
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
  const colors = canvasTheme();
  const view = worldViewBbox();
  for (const feature of state.data.quartals) {
    if (!bboxIntersects(feature.bbox, view)) continue;
    const score = feature.properties.currentScore != null ? feature.properties.currentScore : feature.properties.baseScore;
    drawPath(ctx, feature.polygons, 0);
    ctx.fillStyle = scoreColor(score, 0.82);
    ctx.fill("evenodd");
    ctx.strokeStyle = colors.quarterStroke;
    ctx.lineWidth = 0.36;
    ctx.stroke();
  }
}

// @dist-split
function drawRoads(ctx) {
  const colors = canvasTheme();
  const mainAlpha = zoomFade(0.13, 0.46, 2.7);
  const detailProgress = zoomRangeProgress(ROAD_DETAIL_FACTOR, ROAD_DETAIL_FULL_FACTOR);
  const detailAlpha = isMobileLayout() ? 0 : (0.04 + 0.18 * detailProgress) * detailProgress;
  ctx.save();
  if (detailAlpha > 0.002 && state.roadTiles.size) {
    ctx.lineWidth = 0.72;
    ctx.strokeStyle = colors.roadDetail(detailAlpha);
    for (const tile of state.roadTiles.values()) {
      for (const segment of tile.segments) drawLine(ctx, segment, ROAD_SURFACE_OFFSET);
    }
  }
  ctx.lineWidth = 1.28;
  ctx.strokeStyle = colors.roadMain(mainAlpha);
  for (const line of state.data.roads) drawLine(ctx, line, ROAD_SURFACE_OFFSET);
  ctx.restore();
}

function drawRailways(ctx) {
  if (!state.data.railways || !state.data.railways.length) return;
  const colors = canvasTheme();
  const alpha = zoomFade(0.18, 0.54, 3.2);
  ctx.save();
  ctx.lineWidth = 2.1;
  ctx.strokeStyle = colors.railway(alpha);
  for (const line of state.data.railways) drawLine(ctx, line, RAILWAY_SURFACE_OFFSET);
  ctx.lineWidth = 1.05;
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = colors.railwayDash(alpha);
  for (const line of state.data.railways) drawLine(ctx, line, RAILWAY_SURFACE_OFFSET);
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

function zoomRangeProgress(startRatio, fullRatio) {
  const ratio = state.camera.scale / (state.camera.fitScale || state.camera.scale || 1);
  return clamp((ratio - startRatio) / (fullRatio - startRatio || 1), 0, 1);
}

function canvasTheme() {
  return CANVAS_THEMES[state.theme] || CANVAS_THEMES.light;
}

function buildingAlphaFactor() {
  if (isMobileLayout()) return zoomFade(MOBILE_BUILDING_MIN_ALPHA, 1, MOBILE_BUILDING_FADE_FACTOR);
  return zoomFade(0.015, 1, BUILDING_FADE_FACTOR);
}

function buildingLightenFactor() {
  return 1 - zoomProgress(BUILDING_FADE_FACTOR);
}

function smallBuildingAlphaFactor() {
  const start = isMobileLayout() ? MOBILE_SMALL_NON_RESIDENTIAL_FACTOR : SMALL_NON_RESIDENTIAL_FACTOR;
  const full = isMobileLayout() ? MOBILE_SMALL_NON_RESIDENTIAL_FULL_FACTOR : SMALL_NON_RESIDENTIAL_FULL_FACTOR;
  const t = zoomRangeProgress(start, full);
  return t * t * (3 - 2 * t);
}

function buildingTileAlphaFactor() {
  const t = zoomRangeProgress(BUILDING_DETAIL_FADE_START_FACTOR, BUILDING_DETAIL_FADE_FULL_FACTOR);
  return t * t * (3 - 2 * t);
}

function overviewFadeFromDetailAlpha(detailAlpha) {
  const t = clamp((detailAlpha - BUILDING_OVERVIEW_FADE_DELAY) / (1 - BUILDING_OVERVIEW_FADE_DELAY), 0, 1);
  return t * t * (3 - 2 * t);
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
    const [sx, sy] = worldToScreen(x, y, surfaceZ(x, y, z));
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
        const [sx, sy] = worldToScreen(x, y, surfaceZ(x, y, z));
        if (index === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.closePath();
    }
  }
}

function surfaceZ(x, y, offset = 0) {
  return terrainHeightAt(x, y) + offset;
}

function drawBuildings() {
  if (isMobileLayout()) {
    if (gl && glState) {
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    drawCanvasBuildings(baseCtx);
    return;
  }
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
  const baseAlpha = buildingAlphaFactor();
  gl.uniform1f(glState.uniforms.alphaFactor, baseAlpha);
  gl.uniform1f(glState.uniforms.lightenFactor, buildingLightenFactor());
  gl.uniform1f(glState.uniforms.darkFactor, state.theme === "dark" ? 1 : 0);
  gl.uniform1f(glState.uniforms.depthScale, 62000);
  const meshMode = desiredBuildingMeshMode();
  const overviewMesh =
    state.overviewMeshes.get(meshMode) ||
    state.overviewMeshes.get("full") ||
    state.overviewMeshes.get("residential") ||
    state.overviewMesh;
  const tileAlpha = buildingTileAlphaFactor();
  const detailKeys = visibleBuildingTileKeys();
  const detailMeshes = detailKeys.map((key) => state.tileMeshes.get(key)).filter(Boolean);
  const smallMeshes = detailKeys.map((key) => state.smallTileMeshes.get(key)).filter(Boolean);
  const detailReady = detailKeys.length > 0 && detailMeshes.length === detailKeys.length;
  const detailLoadedAlpha = detailReady ? Math.min(...detailMeshes.map(meshLoadedAlpha)) : 0;
  let needsFadeFrame = false;

  if (!state.overviewMeshes.has(meshMode)) requestOverviewMesh(meshMode);

  const detailAlpha = tileAlpha * detailLoadedAlpha;
  const overviewAlpha = 1 - overviewFadeFromDetailAlpha(detailAlpha);
  if (overviewAlpha > 0.002) {
    needsFadeFrame = drawMeshWithFade(overviewMesh, baseAlpha * overviewAlpha) || needsFadeFrame;
  }
  if (tileAlpha > 0.002 && detailMeshes.length) {
    if (overviewAlpha > 0.002) gl.clear(gl.DEPTH_BUFFER_BIT);
    for (const mesh of detailMeshes) needsFadeFrame = drawMeshWithFade(mesh, baseAlpha * tileAlpha) || needsFadeFrame;
    const smallAlpha = baseAlpha * tileAlpha * smallBuildingAlphaFactor();
    if (smallAlpha > 0.002 && smallMeshes.length) {
      for (const mesh of smallMeshes) needsFadeFrame = drawMeshWithFade(mesh, smallAlpha) || needsFadeFrame;
      gl.uniform1f(glState.uniforms.alphaFactor, baseAlpha);
    }
  }
  if (needsFadeFrame) requestAnimationFrame(() => {
    if (state.data) draw();
  });
}

function drawCanvasBuildings(ctx) {
  if (!state.layers.buildings) return;
  const meshMode = desiredBuildingMeshMode();
  const overviewMesh =
    state.overviewMeshes.get(meshMode) ||
    state.overviewMeshes.get("residential") ||
    state.overviewMeshes.get("standard") ||
    state.overviewMeshes.get("full") ||
    state.overviewMesh;
  if (!state.overviewMeshes.has(meshMode)) requestOverviewMesh(meshMode);

  const tileAlpha = buildingTileAlphaFactor();
  const detailKeys = visibleBuildingTileKeys();
  const detailMeshes = detailKeys
    .map((key) => state.tileMeshes.get(key))
    .filter((mesh) => mesh?.canvasVertices?.length);
  const detailReady = detailKeys.length > 0 && detailMeshes.length === detailKeys.length;
  const detailLoadedAlpha = detailReady ? Math.min(...detailMeshes.map(meshLoadedAlpha)) : 0;
  const detailAlpha = tileAlpha * detailLoadedAlpha;
  const overviewAlpha = overviewMesh ? 1 - overviewFadeFromDetailAlpha(detailAlpha) : 0;
  const baseAlpha = buildingAlphaFactor();
  let needsFadeFrame = false;

  if (overviewAlpha > 0.002) {
    needsFadeFrame = drawCanvasMeshWithFade(ctx, overviewMesh, baseAlpha * overviewAlpha) || needsFadeFrame;
  }
  if (tileAlpha > 0.002 && detailMeshes.length) {
    for (const mesh of detailMeshes) {
      needsFadeFrame = drawCanvasMeshWithFade(ctx, mesh, baseAlpha * tileAlpha) || needsFadeFrame;
    }
  }
  if (needsFadeFrame) requestAnimationFrame(() => {
    if (state.data) draw();
  });
}

function drawCanvasMeshWithFade(ctx, mesh, alpha) {
  if (!mesh?.canvasVertices?.length) return false;
  const loadedAlpha = meshLoadedAlpha(mesh);
  const finalAlpha = alpha * loadedAlpha;
  if (finalAlpha > 0.002) drawCanvasMesh(ctx, mesh, finalAlpha);
  return loadedAlpha < 1;
}

function drawCanvasMesh(ctx, mesh, alpha) {
  const rect = overlayCanvas.getBoundingClientRect();
  const vertices = mesh.canvasVertices;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < vertices.length; i += 12) {
    const p0 = worldToScreen(vertices[i], vertices[i + 1], vertices[i + 2]);
    const p1 = worldToScreen(vertices[i + 4], vertices[i + 5], vertices[i + 6]);
    const p2 = worldToScreen(vertices[i + 8], vertices[i + 9], vertices[i + 10]);
    const minX = Math.min(p0[0], p1[0], p2[0]);
    const maxX = Math.max(p0[0], p1[0], p2[0]);
    const minY = Math.min(p0[1], p1[1], p2[1]);
    const maxY = Math.max(p0[1], p1[1], p2[1]);
    if (maxX < -24 || minX > rect.width + 24 || maxY < -24 || minY > rect.height + 24) continue;
    ctx.fillStyle = canvasBuildingFill(vertices[i + 3]);
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function canvasBuildingFill(style) {
  const shadeKey = Math.round(buildingLightenFactor() * 20);
  const key = `${state.theme}:${shadeKey}:${Math.round(style)}`;
  if (canvasBuildingFill.cache.has(key)) return canvasBuildingFill.cache.get(key);
  const color = buildingStyleRgb(style, shadeKey / 20);
  const value = `rgb(${color.map((channel) => Math.round(channel * 255)).join(", ")})`;
  canvasBuildingFill.cache.set(key, value);
  return value;
}
canvasBuildingFill.cache = new Map();

function buildingStyleRgb(style, lightenFactor = 0) {
  const kind = Math.floor((style + 0.5) / 16);
  const shadeLevel = (style + 0.5) % 16;
  const shade = 0.86 + shadeLevel * 0.012;
  let base = [0.78, 0.78, 0.74];
  if (kind > 0.5 && kind < 1.5) base = [0.75, 0.75, 0.71];
  else if (kind > 1.5 && kind < 2.5) base = [0.69, 0.69, 0.65];
  else if (kind > 2.5 && kind < 3.5) base = [0.68, 0.68, 0.65];
  else if (kind > 3.5 && kind < 4.5) base = [0.65, 0.65, 0.62];
  else if (kind > 4.5) base = [0.6, 0.6, 0.57];
  let color = base.map((value) => clamp(value * shade, 0, 1));
  color = color.map((value, index) => value + ([0.92, 0.92, 0.88][index] - value) * lightenFactor * 0.34);
  if (state.theme === "dark") {
    color = color.map((value, index) => value * [0.62, 0.64, 0.6][index] + [0.43, 0.47, 0.44][index] * 0.2);
  }
  return color.map((value) => clamp(value, 0, 1));
}

function drawOverlay() {
  const rect = overlayCanvas.getBoundingClientRect();
  overlayCtx.clearRect(0, 0, rect.width, rect.height);
  if (state.selected) drawSelected();
  if (state.layers.stops) drawStops();
  if (state.layers.dtp) drawAccidents();
}

function drawSelected() {
  const colors = canvasTheme();
  const phase = performance.now() / 1450;
  const z = 10 + (Math.sin(phase) + 1) * 7;
  drawPath(overlayCtx, state.selected.polygons, z);
  overlayCtx.fillStyle = colors.selectedFill;
  overlayCtx.fill("evenodd");
  overlayCtx.strokeStyle = colors.selectedOuter;
  overlayCtx.lineWidth = 6;
  overlayCtx.stroke();
  drawPath(overlayCtx, state.selected.polygons, z);
  overlayCtx.strokeStyle = colors.selectedInner;
  overlayCtx.lineWidth = 2.4;
  overlayCtx.stroke();
}

function drawStops() {
  const colors = canvasTheme();
  overlayCtx.save();
  overlayCtx.strokeStyle = colors.pointStroke;
  overlayCtx.lineWidth = 1;
  for (const item of state.data.points.stops) {
    const [sx, sy] = worldToScreen(item.point[0], item.point[1], surfaceZ(item.point[0], item.point[1], 12));
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
  const colors = canvasTheme();
  state.accidentDisplayItems = buildAccidentDisplayItems();
  overlayCtx.save();
  overlayCtx.strokeStyle = colors.pointStroke;
  overlayCtx.lineWidth = 1;
  overlayCtx.textAlign = "center";
  overlayCtx.textBaseline = "middle";
  overlayCtx.font = "700 11px system-ui, sans-serif";
  for (const item of state.accidentDisplayItems) {
    const radius = accidentRadius(item);
    const [sx, sy] = worldToScreen(item.point[0], item.point[1], surfaceZ(item.point[0], item.point[1], 15));
    overlayCtx.fillStyle = item.items ? "#893a35" : "#b64c3f";
    overlayCtx.beginPath();
    overlayCtx.arc(sx, sy, radius, 0, Math.PI * 2);
    overlayCtx.fill();
    overlayCtx.stroke();
    if (item.items) {
      overlayCtx.fillStyle = colors.accidentText;
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
    const [sx, sy] = worldToScreen(item.point[0], item.point[1], surfaceZ(item.point[0], item.point[1], 15));
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
async function loadOverviewMeshForCity(city, mode) {
  if (!city?.files3d) return null;
  const buffer = await fetchMeshArrayBuffer(buildingOverviewUrl(city, mode));
  return createBuildingMeshFromPacked(buffer);
}

function buildingOverviewUrl(city, mode) {
  const base = city.files3d.buildingsOverviewBase || String(city.files3d.buildingsOverview || "").replace(/(?:-(?:full|residential))?\.bin$|\.json$/, "");
  return `${base}-${mode}.bin`;
}

function buildingTileUrl(key, mode) {
  return `${state.activeCity.files3d.buildingsTileBase}/${key}-${mode}.bin`;
}

function createBuildingMeshFromPacked(arrayBuffer) {
  if (!arrayBuffer || arrayBuffer.byteLength < 32) return null;
  const view = new DataView(arrayBuffer);
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (magic !== "LIM4") throw new Error("Unsupported building mesh format");
  const vertexCount = view.getUint32(4, true);
  const stride = view.getUint32(28, true) || PACKED_VERTEX_BYTES;
  if (!vertexCount) return null;
  const packedBytes = new Uint8Array(arrayBuffer, 32, vertexCount * stride);
  let vertexBuffer = null;
  if (gl) {
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, packedBytes, gl.STATIC_DRAW);
  }
  const mesh = {
    buffer: vertexBuffer,
    count: vertexCount,
    stride,
    origin: [view.getFloat32(8, true), view.getFloat32(12, true), view.getFloat32(16, true)],
    scale: [view.getFloat32(20, true), view.getFloat32(24, true)],
    loadedAt: performance.now()
  };
  if (isMobileLayout() || !gl) mesh.canvasVertices = unpackCanvasVertices(packedBytes, mesh);
  return mesh;
}

function unpackCanvasVertices(bytes, mesh) {
  const stride = mesh.stride || PACKED_VERTEX_BYTES;
  const result = new Float32Array(mesh.count * 4);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let source = 0, target = 0; source < mesh.count * stride; source += stride, target += 4) {
    result[target] = mesh.origin[0] + view.getInt16(source, true) * mesh.scale[0];
    result[target + 1] = mesh.origin[1] + view.getInt16(source + 2, true) * mesh.scale[0];
    result[target + 2] = mesh.origin[2] + view.getInt16(source + 4, true) * mesh.scale[1];
    result[target + 3] = view.getUint8(source + 6);
  }
  return result;
}

function drawMeshWithFade(mesh, alpha) {
  if (!mesh || mesh.count === 0) return false;
  const loadedAlpha = meshLoadedAlpha(mesh);
  const finalAlpha = alpha * loadedAlpha;
  if (finalAlpha > 0.002) {
    gl.uniform1f(glState.uniforms.alphaFactor, finalAlpha);
    drawMesh(mesh);
  }
  return loadedAlpha < 1;
}

function meshLoadedAlpha(mesh) {
  if (!mesh.loadedAt) return 1;
  const t = clamp((performance.now() - mesh.loadedAt) / 650, 0, 1);
  return t * t * (3 - 2 * t);
}

function drawMesh(mesh) {
  if (!mesh || mesh.count === 0 || !mesh.buffer) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
  gl.enableVertexAttribArray(glState.attributes.position);
  gl.enableVertexAttribArray(glState.attributes.style);
  gl.uniform3f(glState.uniforms.meshOrigin, mesh.origin[0], mesh.origin[1], mesh.origin[2]);
  gl.uniform2f(glState.uniforms.meshScale, mesh.scale[0], mesh.scale[1]);
  gl.vertexAttribPointer(glState.attributes.position, 3, gl.SHORT, false, mesh.stride || PACKED_VERTEX_BYTES, 0);
  gl.vertexAttribPointer(glState.attributes.style, 1, gl.UNSIGNED_BYTE, false, mesh.stride || PACKED_VERTEX_BYTES, 6);
  gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
}

// @dist-split
function initGl(glContext) {
  const vertexSource = `
    attribute vec3 a_pos;
    attribute float a_style;
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
    uniform vec3 u_meshOrigin;
    uniform vec2 u_meshScale;
    varying vec4 v_color;

    vec3 styleColor(float style) {
      float kind = floor((style + 0.5) / 16.0);
      float shadeLevel = mod(style + 0.5, 16.0);
      float shade = 0.86 + shadeLevel * 0.012;
      vec3 base = vec3(0.78, 0.78, 0.74);
      if (kind > 0.5 && kind < 1.5) base = vec3(0.75, 0.75, 0.71);
      else if (kind > 1.5 && kind < 2.5) base = vec3(0.69, 0.69, 0.65);
      else if (kind > 2.5 && kind < 3.5) base = vec3(0.68, 0.68, 0.65);
      else if (kind > 3.5 && kind < 4.5) base = vec3(0.65, 0.65, 0.62);
      else if (kind > 4.5) base = vec3(0.6, 0.6, 0.57);
      return clamp(base * shade, 0.0, 1.0);
    }

    void main() {
      vec3 worldPos = vec3(
        u_meshOrigin.x + a_pos.x * u_meshScale.x,
        u_meshOrigin.y + a_pos.y * u_meshScale.x,
        u_meshOrigin.z + a_pos.z * u_meshScale.y
      );
      float height = worldPos.z * u_heightScale;
      float dx = worldPos.x - u_center.x;
      float dy = worldPos.y - u_center.y;
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
      v_color = vec4(styleColor(a_style), 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying vec4 v_color;
    uniform float u_alphaFactor;
    uniform float u_lightenFactor;
    uniform float u_darkFactor;
    void main() {
      vec3 liftedColor = mix(v_color.rgb, vec3(0.92, 0.92, 0.88), u_lightenFactor * 0.48);
      vec3 darkColor = mix(v_color.rgb * vec3(0.62, 0.64, 0.6), vec3(0.43, 0.47, 0.44), u_lightenFactor * 0.28);
      gl_FragColor = vec4(mix(liftedColor, darkColor, u_darkFactor), v_color.a * u_alphaFactor);
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
      style: glContext.getAttribLocation(program, "a_style")
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
      darkFactor: glContext.getUniformLocation(program, "u_darkFactor"),
      depthScale: glContext.getUniformLocation(program, "u_depthScale"),
      meshOrigin: glContext.getUniformLocation(program, "u_meshOrigin"),
      meshScale: glContext.getUniformLocation(program, "u_meshScale")
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
  if (!state.data) return;
  const requestBuildings = state.camera.scale >= state.camera.fitScale * BUILDING_DETAIL_REQUEST_FACTOR;
  const requestRoads = !isMobileLayout() && state.camera.scale >= state.camera.fitScale * ROAD_DETAIL_REQUEST_FACTOR;
  if (!requestBuildings && !requestRoads) return;
  const keys = visibleTileKeys();
  const meshMode = desiredBuildingMeshMode();
  for (const key of keys) {
    if (requestBuildings && state.data.availableBuildingTiles.has(key) && state.tileMeshModes.get(key) !== meshMode) {
      requestBuildingTile(key, meshMode);
    }
    if (
      requestBuildings &&
      !isMobileLayout() &&
      smallBuildingAlphaFactor() > 0.002 &&
      state.data.availableBuildingTiles.has(key) &&
      !state.smallTileMeshes.has(key)
    ) {
      requestSmallBuildingTile(key);
    }
    if (
      requestRoads &&
      state.data.availableRoadTiles.has(key) &&
      !state.roadTiles.has(key)
    ) {
      requestRoadTile(key);
    }
  }
}

function requestOverviewMesh(meshMode) {
  if (!state.activeCity || state.overviewMeshes.has(meshMode) || state.loadingOverviewMeshes.has(meshMode)) return;
  const token = state.renderToken;
  state.loadingOverviewMeshes.add(meshMode);
  loadOverviewMeshForCity(state.activeCity, meshMode)
    .then((mesh) => {
      if (token !== state.renderToken || !mesh) return;
      state.overviewMeshes.set(meshMode, mesh);
      if (!state.overviewMesh) state.overviewMesh = mesh;
    })
    .catch((error) => console.error(error))
    .finally(() => {
      state.loadingOverviewMeshes.delete(meshMode);
      draw();
    });
}

function requestBuildingTile(key, meshMode) {
  const requestKey = `b:${key}:${meshMode}`;
  if (state.loadingTiles.has(requestKey)) return;
  state.loadingTiles.add(requestKey);
  loadBuildingTile(key, meshMode)
    .catch((error) => console.error(error))
    .finally(() => {
      state.loadingTiles.delete(requestKey);
      draw();
    });
}

async function loadBuildingTile(key, meshMode) {
  const buffer = await fetchMeshArrayBuffer(buildingTileUrl(key, meshMode));
  setTileMesh(key, createBuildingMeshFromPacked(buffer), meshMode);
}

function requestSmallBuildingTile(key) {
  const requestKey = `bs:${key}`;
  if (state.loadingTiles.has(requestKey)) return;
  state.loadingTiles.add(requestKey);
  loadSmallBuildingTile(key)
    .catch((error) => console.error(error))
    .finally(() => {
      state.loadingTiles.delete(requestKey);
      draw();
    });
}

async function loadSmallBuildingTile(key) {
  const buffer = await fetchMeshArrayBuffer(buildingTileUrl(key, "small"));
  setSmallTileMesh(key, createBuildingMeshFromPacked(buffer));
}

function requestRoadTile(key) {
  const requestKey = `r:${key}`;
  if (state.loadingTiles.has(requestKey)) return;
  state.loadingTiles.add(requestKey);
  fetchJson(`${state.activeCity.files3d.roadsAllTileBase}/${key}.json`)
    .then((payload) => {
      state.roadTiles.set(key, payload);
    })
    .catch((error) => console.error(error))
    .finally(() => {
      state.loadingTiles.delete(requestKey);
      draw();
    });
}

function setTileMesh(key, mesh, meshMode) {
  const previous = state.tileMeshes.get(key);
  if (previous) {
    if (gl && previous.buffer) gl.deleteBuffer(previous.buffer);
  }
  if (mesh) state.tileMeshes.set(key, mesh);
  else state.tileMeshes.delete(key);
  state.tileMeshModes.set(key, meshMode);
}

function setSmallTileMesh(key, mesh) {
  const previous = state.smallTileMeshes.get(key);
  if (gl && previous?.buffer) gl.deleteBuffer(previous.buffer);
  if (mesh) state.smallTileMeshes.set(key, mesh);
  else state.smallTileMeshes.delete(key);
}

function desiredBuildingMeshMode() {
  if (isMobileLayout()) return "residential";
  return "standard";
}

function initialBuildingMeshMode() {
  return isMobileLayout() ? "residential" : "standard";
}

function showNonResidentialBuildings() {
  return state.camera.scale >= state.camera.fitScale * MOBILE_NON_RESIDENTIAL_FACTOR;
}

function showSmallNonResidentialBuildings() {
  return smallBuildingAlphaFactor() > 0.002;
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

function visibleBuildingTileKeys() {
  if (!state.data || state.camera.scale < state.camera.fitScale * BUILDING_DETAIL_REQUEST_FACTOR) return [];
  return visibleTileKeys().filter((key) => state.data.availableBuildingTiles.has(key));
}

function recomputeScores() {
  if (!state.data) return;
  const active = [...state.activeBlocks];
  const fullScenario = active.length === BLOCKS.length && BLOCKS.every((block) => state.activeBlocks.has(block.key));
  for (const feature of state.data.quartals) {
    const baseScore = comparisonScore(feature.properties);
    if (fullScenario && Number.isFinite(baseScore)) {
      feature.properties.currentScore = baseScore;
      continue;
    }
    const blocks = comparisonBlocks(feature.properties);
    const values = active
      .map((key) => blocks ? blocks[key] : undefined)
      .filter((value) => Number.isFinite(value));
    feature.properties.currentScore = values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length) * 100 : null;
  }
  const ranked = state.data.quartals
    .filter((feature) => Number.isFinite(feature.properties.currentScore))
    .sort((a, b) => b.properties.currentScore - a.properties.currentScore);
  ranked.forEach((feature, index) => {
    feature.properties.currentRank = index + 1;
  });
  if (fullScenario) {
    for (const feature of state.data.quartals) {
      const rank = comparisonRank(feature.properties);
      if (Number.isFinite(rank)) feature.properties.currentRank = rank;
    }
  }
}

function comparisonData(properties) {
  return properties?.compare?.[state.comparisonMode] ?? null;
}

function comparisonBlocks(properties) {
  return comparisonData(properties)?.blocks ?? properties?.blocks ?? null;
}

function comparisonScore(properties) {
  return comparisonData(properties)?.score ?? properties?.baseScore ?? null;
}

function comparisonRank(properties) {
  return comparisonData(properties)?.rank ?? properties?.baseRank ?? null;
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

function cityBaseScore() {
  if (!state.data) return null;
  let weighted = 0;
  let total = 0;
  for (const feature of state.data.quartals) {
    const score = comparisonScore(feature.properties);
    const weight = feature.properties.population;
    if (!Number.isFinite(score) || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += score * weight;
    total += weight;
  }
  return total > 0 ? weighted / total : state.activeCity?.index ?? null;
}

function cityBlockScores() {
  const result = {};
  for (const block of BLOCKS) {
    let weighted = 0;
    let total = 0;
    for (const feature of state.data.quartals) {
      const blocks = comparisonBlocks(feature.properties);
      const value = blocks ? blocks[block.key] : undefined;
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
  const world = screenToWorldOnTerrain(screen[0], screen[1]);
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
    const [sx, sy] = worldToScreen(item.point[0], item.point[1], surfaceZ(item.point[0], item.point[1], 15));
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
  const targetScale = Math.min(state.camera.scale * 2.35, cameraMaxScale());
  animateCameraTo(cluster.point, targetScale, 720);
}

function animateCameraTo(targetCenter, targetScale, duration = 650) {
  stopCameraAnimation();
  targetScale = clamp(targetScale, cameraMinScale(), cameraMaxScale());
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
    clampCameraCenter();
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
  stopProgrammaticCameraAnimation();
  stopSmoothZoom();
  stopCameraInertia();
}

function stopProgrammaticCameraAnimation() {
  if (state.cameraAnimation) cancelAnimationFrame(state.cameraAnimation);
  state.cameraAnimation = null;
}

function stopSmoothZoom() {
  if (state.smoothZoom?.frame) cancelAnimationFrame(state.smoothZoom.frame);
  state.smoothZoom = null;
}

function stopCameraInertia() {
  if (state.cameraInertia?.frame) cancelAnimationFrame(state.cameraInertia.frame);
  state.cameraInertia = null;
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
  const [sx, sy] = worldToScreen(item.point[0], item.point[1], surfaceZ(item.point[0], item.point[1], 30));
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
  const baseScore = cityBaseScore();
  const previousValues = state.panelValues;
  const nextValues = panelAnimationValues(cityScore);
  els.topMetric.textContent = `Сценарный индекс ${formatNumber(cityScore, 2)} · Основной индекс ${formatNumber(baseScore, 2)}`;
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
    const blocks = comparisonBlocks(props);
    return {
      metricFormats,
      metrics: [props.currentScore, comparisonScore(props), comparisonRank(props), props.population],
      bars: BLOCKS.map((block) => {
        const value = blocks ? blocks[block.key] : null;
        return value == null ? null : value * 100;
      })
    };
  }
  const city = state.activeCity;
  const cityBars = cityBlockScores();
  return {
    metricFormats,
    metrics: [cityScore, cityBaseScore(), city.rank, city.population],
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
  const baseScore = cityBaseScore();
  return `
    <button class="sheetHandle" type="button" aria-label="Свернуть или раскрыть панель"></button>
    <div class="panelTitle">
      <div class="panelHeading">
        <h2>${city.name}</h2>
      </div>
      ${renderComparisonSwitch()}
    </div>
    <div class="metricGrid">
      <div class="metric"><strong>${formatNumber(cityScore, 2)}</strong><span>Сценарный индекс</span></div>
      <div class="metric"><strong>${formatNumber(baseScore, 2)}</strong><span>Основной индекс</span></div>
      <div class="metric"><strong>${formatInt(city.rank)}</strong><span>Ранг</span></div>
      <div class="metric"><strong>${formatInt(city.population)}</strong><span>Численность населения</span></div>
    </div>
    ${renderBars(cityBlockScores())}
  `;
}

function renderQuarterPanel(feature) {
  const props = feature.properties;
  const blocks = comparisonBlocks(props);
  return `
    <button class="sheetHandle" type="button" aria-label="Свернуть или раскрыть панель"></button>
    <div class="panelTitle">
      <div class="panelHeading">
        <h2>Квартал ${props.id}</h2>
      </div>
      ${renderComparisonSwitch()}
    </div>
    <div class="metricGrid">
      <div class="metric"><strong>${formatNumber(props.currentScore, 2)}</strong><span>Сценарный индекс</span></div>
      <div class="metric"><strong>${formatNumber(comparisonScore(props), 2)}</strong><span>Основной индекс</span></div>
      <div class="metric"><strong>${formatNumber(comparisonRank(props), 0)}</strong><span>Ранг</span></div>
      <div class="metric"><strong>${formatInt(props.population)}</strong><span>Численность населения</span></div>
    </div>
    ${renderBars(blockScoreValues(blocks))}
    ${renderGroupedIndicators(props.indicators || [])}
  `;
}

function renderComparisonSwitch() {
  const isAll = state.comparisonMode === "all";
  return `
    <div class="comparisonSwitch" aria-label="Уровень сравнения">
      <button class="comparisonToggle ${isAll ? "isAll" : "isCity"}" type="button" data-comparison-toggle aria-pressed="${isAll}" aria-label="Переключить уровень сравнения">
        <span></span>
      </button>
      <div class="comparisonLabels">
        <span class="comparisonLabel comparisonLabelTop ${isAll ? "active" : ""}">Общегородское</span>
        <span class="comparisonShared active">сравнение</span>
        <span class="comparisonLabel comparisonLabelBottom ${isAll ? "" : "active"}">Внутригородское</span>
      </div>
    </div>
  `;
}

function renderGroupedIndicators(indicators) {
  const groups = new Map();
  for (const item of indicators) {
    const value = Number(item.value);
    if (!isVisibleIndicatorValue(value)) continue;
    const parts = item.label.split(":").map((part) => part.trim());
    const group = parts.length > 1 ? parts[0] : "Показатели";
    const label = parts.length > 1 ? parts[1] : parts[0];
    const meta = indicatorMeta(group, label);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      unit: meta.unit,
      help: meta.help
    });
  }
  if (!groups.size) return "";
  return `
    <div class="indicatorList">
      ${[...groups.entries()]
        .map(
          ([group, items]) => `
            <section class="indicatorGroup">
              <h3 data-tooltip="${escapeAttr(GROUP_HELP[group] || "")}">${group}</h3>
              ${items
                .map(
                  (item) => `
                    <div class="indicator" data-tooltip="${escapeAttr(item.help)}">
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

function isVisibleIndicatorValue(value) {
  return Number.isFinite(value) && Math.abs(value) >= 0.005;
}

function renderBars(values) {
  return `
    <div class="barList">
      ${BLOCKS.map((block) => {
        const value = values ? values[block.key] : undefined;
        const normalized = Number.isFinite(value) ? clamp(value, 0, 100) : 0;
        return `
          <div class="barRow" data-tooltip="${escapeAttr(block.help)}">
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
  const toned = state.theme === "dark" ? rgb.map((channel) => Math.round(channel * 0.66)) : rgb;
  return `rgba(${toned[0]}, ${toned[1]}, ${toned[2]}, ${alpha})`;
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
