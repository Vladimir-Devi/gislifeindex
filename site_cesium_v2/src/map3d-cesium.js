const SITE_CONFIG = window.LIFEINDEX_SITE_CONFIG || {};
const SITE_BRAND = SITE_CONFIG.brand || "";
const SINGLE_CITY_SLUG = SITE_CONFIG.singleCity || "";
const SINGLE_CITY_MODE = Boolean(SINGLE_CITY_SLUG);
const BRAND_BLOCK_COLORS = {
  dimitrovgrad: {
    housing: "#3960b7",
    infra: "#8ca7f4",
    transport: "#428ebd",
    work: "#b494f9",
    green: "#4f8a57",
    commerce: "#f261a1"
  }
};
const BRAND_SCORE_STOPS = {
  dimitrovgrad: [
    [0, [235, 19, 107]],
    [28, [242, 97, 161]],
    [52, [195, 209, 249]],
    [76, [140, 167, 244]],
    [100, [192, 236, 52]]
  ]
};

function brandBlockColor(key, fallback) {
  return BRAND_BLOCK_COLORS[SITE_BRAND]?.[key] || fallback;
}

function brandScoreStops(fallback) {
  return BRAND_SCORE_STOPS[SITE_BRAND] || fallback;
}

const BLOCKS = [
  {
    key: "housing",
    label: "Жильё",
    color: brandBlockColor("housing", "#256d72"),
    help: "Показывает, насколько комфортна жилая среда квартала: плотность, обеспеченность жильём, состояние и этажность домов."
  },
  {
    key: "infra",
    label: "Коммерческая инфраструктура",
    color: brandBlockColor("infra", "#6f6c2d"),
    help: "Оценивает, есть ли рядом с жителями повседневные места: магазины, услуги и другие городские функции."
  },
  {
    key: "transport",
    label: "Транспорт",
    color: brandBlockColor("transport", "#316a9c"),
    help: "Показывает, насколько удобно жителям дойти до остановок общественного транспорта."
  },
  {
    key: "work",
    label: "Крупные работодатели",
    color: brandBlockColor("work", "#7b5796"),
    help: "Показывает связь квартала с крупными местами занятости."
  },
  {
    key: "green",
    label: "Зелёные зоны",
    color: brandBlockColor("green", "#477f5b"),
    help: "Оценивает доступность парков, скверов и других зелёных территорий."
  },
  {
    key: "commerce",
    label: "Экономика",
    color: brandBlockColor("commerce", "#b88624"),
    help: "Показывает деловую и потребительскую активность территории по косвенным признакам. Используется только во внутригородском сравнении."
  }
];

const USER_LAYERS = [
  { key: "quartals", label: "Кварталы" },
  { key: "buildings", label: "Здания" },
  { key: "trees", label: "Деревья" },
  { key: "stops", label: "Остановки ОТ" },
  { key: "dtp", label: "ДТП" }
];

const START_VIEW_QUARTER_IDS = {
  orel: "105",
  tambov: "292",
  dimitrovgrad: "1"
};

const INDICATOR_UNITS = {
  "плотность": "чел/га",
  "обеспеченность": "м2/чел",
  "износ": "%",
  "этажность": "этажей",
  "разнообразие": "0-1",
  "полнота корзины": "%",
  "доступность": "%",
  "покрытие": "%",
  "температура": "°C",
  "ккт": "ед.",
  "медианный чек": "руб.",
  "активность фнс": "0-10"
};

const METHOD_TEXT = {
  scenario: {
    title: "Сценарный индекс",
    text: "Итоговая оценка квартала по тем направлениям, которые сейчас включены в сценариях. Если выключить одно направление, индекс пересчитывается и показывает, как квартал выглядит без него."
  },
  base: {
    title: "Основной индекс",
    text: "Базовая оценка квартала или города по всем направлениям сразу. Она нужна как исходная точка сравнения и не меняется при включении или выключении сценариев."
  },
  rank: {
    title: "Ранг",
    text: "Место квартала или города в общем рейтинге. Чем меньше число, тем выше позиция территории среди остальных."
  },
  population: {
    title: "Численность населения",
    text: "Сколько жителей относится к выбранной территории. Для города показана общая численность, для квартала — расчётное число жителей внутри его границ."
  }
};

const METHOD_VISUAL_ASSET_BASE = "public/method-visuals";
const DATA_CACHE_BUSTER = "orel-pop-sum-2-20260524";
const METHOD_VISUAL_ASSETS = {
  scenario: "metric-scenario",
  base: "metric-base",
  rank: "metric-rank",
  population: "metric-population",
  housing: "block-housing",
  infra: "block-infra",
  transport: "block-transport",
  work: "block-work",
  green: "block-green",
  commerce: "block-commerce",
  indicator: "indicator-generic"
};

const THEME_KEY = "lifeindex.theme";
const TUTORIAL_KEY = "lifeindex.cesiumTutorial.dismissed";
const DEFAULT_LAYER_KEYS = ["quartals", "buildings", "trees"];
const ALL_LAYER_KEYS = USER_LAYERS.map((layer) => layer.key);
const DEFAULT_BLOCK_KEYS = BLOCKS.map((block) => block.key);
const SELECTED_PULSE_MS = 1450;
const SELECTED_Z_BASE = 10;
const SELECTED_Z_AMPLITUDE = 7;
const LINE_STYLE_EPS = 0.035;
const SHOW_TERRAIN_SURFACE = false;
const QUARTAL_COLOR_ANIMATION_MS = 650;
const QUARTAL_ALPHA = 0.86;
const QUARTAL_Z_OFFSET = -2.82;
const QUARTAL_LINE_Z_OFFSET = 1.08;
const SURFACE_POLYGON_Z_OFFSET = -0.92;
const GREEN_POLYGON_Z_OFFSET = SURFACE_POLYGON_Z_OFFSET + 0.35;
const SURFACE_LINE_Z_OFFSET = 0.72;
const ROAD_Z_OFFSET = -2.32;
const RAILWAY_Z_OFFSET = -2.35;
const POINT_GROUND_Z_OFFSET = -0.18;
const BUILDING_Z_OFFSET = 0;
const POINT_DATA_Z_OFFSETS = { stops: 6, dtp: 7 };
const ROAD_LABEL_DATA_Z_OFFSET = 5;
const POINT_DEPTH_DISABLE_DISTANCE = 1000000000;
const PICK_EDGE_TOLERANCE = 7;
const ACCIDENT_CLUSTER_SMOOTHING = 0.2;
const ACCIDENT_CLUSTER_SIGNATURE_EPS = 14;
const ACCIDENT_CLUSTER_UPDATE_INTERVAL_MS = 90;
const CAMERA_MIN_ZOOM_DISTANCE = 55;
const CAMERA_MAX_ZOOM_DISTANCE = 42000;
const CAMERA_WHEEL_ZOOM_RATE = 0.00135;
const CAMERA_WHEEL_MAX_DELTA = 220;
const CAMERA_MIN_PITCH_DEG = -87;
const CAMERA_MAX_PITCH_DEG = -2;
const CAMERA_ZOOM_METRIC_PITCH_FACTOR = 0.829;
const CAMERA_PAN_SPEED_FACTOR = 1.15;
const CAMERA_PAN_MIN_METERS_PER_PIXEL = 0.08;
const CAMERA_PAN_MAX_METERS_PER_PIXEL = 80;
const CAMERA_INERTIA_DECAY = 0.88;
const CAMERA_INERTIA_MIN_SPEED = 0.08;
const CAMERA_INERTIA_MAX_PIXELS = 26;
const ROAD_DETAIL_START_HEIGHT = 1500;
const ROAD_DETAIL_FULL_HEIGHT = 650;
const ROAD_LABEL_START_HEIGHT = 3400;
const ROAD_LABEL_FULL_HEIGHT = 2300;
const ROAD_LABEL_PITCH_FADE_START = -48;
const ROAD_LABEL_PITCH_FADE_END = -58;
const ROAD_LABEL_DRAW_ALPHA_MIN = 0.42;
const ROAD_LABEL_FULL_ALPHA_AT = 0.68;
const TREE_START_HEIGHT = 5200;
const TREE_FULL_HEIGHT = 2600;
const TREE_MAX_DESKTOP = 4200;
const TREE_GROUND_Z_OFFSET = -0.2;
const TREE_CROWN_VISUAL_SCALE = 0.82;
const TREE_TRUNK_VISUAL_SCALE = 0.72;
const TREE_RENDER_RADIUS_MIN = 650;
const TREE_RENDER_RADIUS_MAX = 3100;
const TREE_TILE_LOAD_BUFFER = 1.32;
const TREE_VIEW_SIGNATURE_STEP_M = 620;
const TREE_RADIUS_SIGNATURE_STEP_M = 520;
const TREE_REFRESH_DELAY_MS = 180;
const TREE_POINT_SIZE = 5.3;
const TREE_POINT_SIZE_NEAR = 7.1;
const ROAD_DETAIL_RENDER_RADIUS_MIN = 420;
const ROAD_DETAIL_RENDER_RADIUS_MAX = 1450;
const ROAD_DETAIL_VIEW_SIGNATURE_STEP_M = 260;
const ROAD_DETAIL_RADIUS_SIGNATURE_STEP_M = 220;
const ROAD_DETAIL_MAX_LINES = 2800;
const MOBILE_BUILDING_SSE = 11;
const DESKTOP_BUILDING_SSE = 6;

const MAP_THEMES = {
  light: {
    mapBg: "#e7e0d3",
    waterFill: "rgba(87, 145, 176, 0.44)",
    waterStroke: "rgba(54, 106, 138, 0.32)",
    greenFill: "rgb(180, 193, 166)",
    greenStroke: "rgba(61, 92, 58, 0.2)",
    quarterStroke: "rgba(64, 66, 62, 0.42)",
    roadDetail: (alpha) => `rgba(91, 96, 96, ${alpha})`,
    roadMedium: "rgba(126, 136, 132, 0.42)",
    roadMain: "rgb(126, 136, 132)",
    roadMainFar: "rgb(158, 166, 162)",
    railway: "rgba(244, 238, 226, 0.76)",
    railwayDash: "rgba(28, 28, 27, 0.78)",
    selectedFill: "rgba(255, 246, 199, 0.16)",
    selectedOuter: "rgba(30, 37, 40, 0.42)",
    selectedInner: "#1e2528",
    pointStroke: "#ffffff",
    accident: "#b64c3f",
    accidentCluster: "#893a35",
    accidentText: "#fffaf1",
    treeTrunk: "#746a55",
    treeCrown: ["#71806a", "#7a8b70", "#65785f"],
    bus: "#316a9c",
    tram: "#b64c3f",
    roadLabel: "rgba(35, 42, 43, 0.78)",
    roadLabelHalo: "rgba(250, 245, 233, 0.55)"
  },
  dark: {
    mapBg: "#101617",
    waterFill: "rgba(55, 103, 128, 0.42)",
    waterStroke: "rgba(94, 152, 181, 0.28)",
    greenFill: "rgb(31, 55, 40)",
    greenStroke: "rgba(111, 158, 99, 0.2)",
    quarterStroke: "rgba(214, 218, 206, 0.24)",
    roadDetail: (alpha) => `rgba(50, 59, 58, ${Math.min(0.36, alpha + 0.08)})`,
    roadMedium: "rgba(55, 64, 63, 0.46)",
    roadMain: "rgb(67, 78, 77)",
    roadMainFar: "rgb(42, 50, 50)",
    railway: "rgba(84, 88, 82, 0.82)",
    railwayDash: "rgba(222, 219, 204, 0.78)",
    selectedFill: "rgba(255, 222, 132, 0.12)",
    selectedOuter: "rgba(255, 238, 176, 0.36)",
    selectedInner: "#fff2bd",
    pointStroke: "#111719",
    accident: "#b64c3f",
    accidentCluster: "#893a35",
    accidentText: "#fffaf1",
    treeTrunk: "#1c1814",
    treeCrown: ["#101b14", "#142119", "#0d1711"],
    bus: "#316a9c",
    tram: "#b64c3f",
    roadLabel: "rgba(236, 229, 208, 0.78)",
    roadLabelHalo: "rgba(12, 17, 19, 0.55)"
  }
};

const BRAND_MAP_THEME_OVERRIDES = {
  dimitrovgrad: {
    light: {
      mapBg: "#fbfcff",
      waterFill: "rgba(66, 142, 189, 0.42)",
      waterStroke: "rgba(57, 96, 183, 0.28)",
      greenFill: "rgba(74, 112, 69, 0.62)",
      greenStroke: "rgba(42, 78, 48, 0.34)",
      quarterStroke: "rgba(21, 28, 36, 0.4)",
      roadMain: "rgb(126, 136, 158)",
      roadMainFar: "rgb(190, 197, 212)",
      roadMedium: "rgba(151, 162, 183, 0.58)",
      railway: "rgba(255, 255, 255, 0.82)",
      railwayDash: "rgba(45, 75, 143, 0.72)",
      selectedFill: "rgba(226, 214, 148, 0.18)",
      selectedOuter: "rgba(45, 75, 143, 0.44)",
      selectedInner: "#2d4b8f",
      accident: "#eb136b",
      accidentCluster: "#b80f55",
      accidentText: "#ffffff",
      bus: "#3960b7",
      tram: "#f261a1",
      roadLabel: "rgba(13, 18, 41, 0.74)",
      roadLabelHalo: "rgba(255, 255, 255, 0.64)"
    },
    dark: {
      mapBg: "#0d1229",
      waterFill: "rgba(66, 142, 189, 0.32)",
      waterStroke: "rgba(140, 167, 244, 0.22)",
      greenFill: "rgba(31, 62, 38, 0.68)",
      greenStroke: "rgba(91, 126, 77, 0.24)",
      quarterStroke: "rgba(217, 222, 210, 0.26)",
      roadMain: "rgb(70, 82, 108)",
      roadMainFar: "rgb(44, 52, 72)",
      roadMedium: "rgba(75, 87, 111, 0.52)",
      railway: "rgba(103, 119, 158, 0.76)",
      railwayDash: "rgba(255, 255, 255, 0.72)",
      selectedFill: "rgba(226, 214, 148, 0.12)",
      selectedOuter: "rgba(195, 209, 249, 0.34)",
      selectedInner: "#e1b45c",
      accident: "#f261a1",
      accidentCluster: "#eb136b",
      bus: "#8ca7f4",
      tram: "#f261a1",
      roadLabel: "rgba(238, 242, 255, 0.78)",
      roadLabelHalo: "rgba(13, 18, 41, 0.62)"
    }
  }
};

function mapThemePalette(theme = state.theme) {
  return {
    ...(MAP_THEMES[theme] || MAP_THEMES.light),
    ...(BRAND_MAP_THEME_OVERRIDES[SITE_BRAND]?.[theme] || {})
  };
}

const state = {
  manifest: null,
  viewer: null,
  handler: null,
  activeCity: null,
  data: null,
  selectedFeature: null,
  activeBlocks: new Set(DEFAULT_BLOCK_KEYS),
  visibleLayers: new Set(DEFAULT_LAYER_KEYS),
  debugMode: null,
  comparisonMode: "city",
  theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  entities: new Map(),
  dataSources: new Map(),
  primitiveGroups: new Map(),
  tilesets: new Map(),
  accidentPopup: null,
  accidentPopupCameraSignature: null,
  methodCardKey: null,
  infoPreviousValues: null,
  comparisonTransition: null,
  comparisonTransitionTimer: null,
  routeApplying: false,
  infoExpanded: false,
  selectedPulseTimer: null,
  lastLineStyleFactor: null,
  lastRoadDetailSignature: null,
  lastRoadLabelVisible: null,
  quartalColorAnimation: null,
  compassRotationDeg: null,
  compassMovingTimer: null,
  suppressClickUntil: 0,
  cameraPan: null,
  cameraOrbit: null,
  cameraInertia: null,
  cameraInertiaFrame: null,
  accidentAnimatedItems: new Map(),
  accidentAnimationFrame: null,
  accidentClusterRenderFrame: null,
  accidentClusterRenderForce: false,
  accidentDisplayItems: [],
  accidentScreenItems: [],
  lastAccidentClusterSignature: null,
  lastAccidentViewSignature: null,
  lastAccidentClusterUpdateAt: 0,
  accidentClusterTargets: null,
  lastTreeStyle: null,
  treeRefreshScheduled: false,
  treeRefreshTimer: null,
  treeTilesetPromise: null,
  roadDetailPromise: null
};

const els = {
  backButton: document.getElementById("backButton"),
  pageTitle: document.getElementById("pageTitle"),
  topMetric: document.getElementById("topMetric"),
  themeToggle: document.getElementById("themeToggle"),
  cityMenu: document.getElementById("cityMenu"),
  mapShell: document.getElementById("mapShell"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  pointToast: document.getElementById("pointToast"),
  scenarioControls: document.getElementById("scenarioControls"),
  layerControls: document.getElementById("layerControls"),
  resetView: document.getElementById("resetView"),
  infoPanel: document.getElementById("infoPanel"),
  compassButton: document.getElementById("compassButton"),
  compassDial: document.getElementById("compassDial"),
  legend: document.getElementById("legend"),
  symbolLegend: document.getElementById("symbolLegend"),
  tutorial: document.getElementById("cameraTutorial"),
  accidentPopup: document.getElementById("accidentPopup"),
  accidentCanvas: document.getElementById("accidentCanvas"),
  roadLabelCanvas: document.getElementById("roadLabelCanvas")
};

init();

async function init() {
  applyTheme(state.theme);
  bindGlobalUi();
  if (!window.Cesium) {
    showHomeError("Не удалось загрузить CesiumJS. Проверьте подключение к CDN Cesium.");
    return;
  }
  try {
    state.manifest = await fetchJson("data/manifest.json");
    renderCityMenu();
    applyRoute(false);
  } catch (error) {
    console.error(error);
    showHomeError("Данные Cesium-версии ещё не собраны. Выполните node site_cesium_v2\\scripts\\build-tiles.mjs.");
  }
}

function bindGlobalUi() {
  els.backButton.addEventListener("click", () => closeCity(true));
  els.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme(state.theme);
    if (state.viewer && state.data) {
      renderBaseLayerColors();
      renderQuartals();
      updateTrees(true);
      rerenderVisiblePointLayers();
    }
    updateUrl();
  });
  els.resetView.addEventListener("click", () => flyToCity(true));
  els.compassButton.addEventListener("click", () => rotateNorth());
  els.infoPanel.addEventListener("click", (event) => {
    const comparisonToggle = event.target.closest("[data-comparison-toggle]");
    if (!comparisonToggle || !els.infoPanel.contains(comparisonToggle)) return;
    event.preventDefault();
    setComparisonMode(state.comparisonMode === "all" ? "city" : "all");
  });
  window.addEventListener("popstate", () => applyRoute(false));
  window.addEventListener("resize", () => {
    if (state.activeCity) {
      disableMobileTrees();
      applyLoadingProfile();
      renderControls();
      setupInfoPanelGestures();
      if (state.visibleLayers.has("dtp")) scheduleAccidentClusterUpdate(true);
    }
  });
}

function showHomeError(text) {
  els.cityMenu.innerHTML = `<div class="errorBox">${escapeHtml(text)}</div>`;
}

function applyTheme(theme) {
  state.theme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = state.theme;
  els.themeToggle.setAttribute("aria-pressed", String(state.theme === "dark"));
  els.themeToggle.title = state.theme === "dark" ? "Светлая тема" : "Ночная тема";
  try {
    localStorage.setItem(THEME_KEY, state.theme);
  } catch (error) {}
  if (state.viewer) {
    state.viewer.scene.backgroundColor = Cesium.Color.fromCssColorString(themeColor("mapBg"));
    applyBuildingTheme();
    applyTreeTheme();
    if (state.data) {
      renderBaseLayerColors();
      renderQuartals();
      rerenderVisiblePointLayers();
    }
    requestSceneRender();
  }
}

function renderCityMenu() {
  const cities = [...state.manifest.cities].sort((a, b) => a.rank - b.rank);
  els.cityMenu.classList.toggle("singleCityMenu", SINGLE_CITY_MODE);
  els.cityMenu.innerHTML = cities.map((city) => `
    <article class="cityCard pkmn-card pkmn-card--rare" data-city="${escapeAttr(city.slug)}">
      <div class="cityCardTop">
        <h2 class="cityName">${escapeHtml(city.name)}</h2>
        <div class="cityRating"><strong>${formatNumber(city.index, 2)}</strong><span>место ${formatInt(city.rank)}</span></div>
      </div>
      <div class="crestSlot"><img src="${escapeAttr(cityCrestSrc(city))}" alt="Герб ${escapeAttr(city.name)}" loading="lazy"></div>
      <dl class="cityFacts">
        <div><dt>Жители</dt><dd>${formatInt(city.population)}</dd></div>
        <div><dt>Кварталы</dt><dd>${formatInt(city.stats?.quartals)}</dd></div>
      </dl>
      <div class="qualityMix" aria-label="Структура населения по качеству среды">
        <div class="qualityTitle">Структура населения по качеству среды:</div>
        <div class="qualityBar">
          <span class="qualityBad" style="width:${percentWidth(city.lowShare)}%"></span>
          <span class="qualityMid" style="width:${percentWidth(city.midShare)}%"></span>
          <span class="qualityGood" style="width:${percentWidth(city.highShare)}%"></span>
        </div>
        <div class="qualityLegend">
          <span><i class="qualityDot bad"></i>Плохая ${formatPercent(city.lowShare)}</span>
          <span><i class="qualityDot mid"></i>Средняя ${formatPercent(city.midShare)}</span>
          <span><i class="qualityDot good"></i>Хорошая ${formatPercent(city.highShare)}</span>
        </div>
      </div>
    </article>
  `).join("");
  for (const card of els.cityMenu.querySelectorAll(".cityCard")) {
    card.addEventListener("click", () => openCity(card.dataset.city, true));
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const mx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const my = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      const px = `${(mx * 100).toFixed(1)}%`;
      const py = `${(my * 100).toFixed(1)}%`;
      const rotateX = (0.5 - my) * 11;
      const rotateY = (mx - 0.5) * 14;
      card.style.setProperty("--mx", mx.toFixed(3));
      card.style.setProperty("--my", my.toFixed(3));
      card.style.setProperty("--pos", `${px} ${py}`);
      card.style.setProperty("--posx", px);
      card.style.setProperty("--posy", py);
      card.style.setProperty("--glare-pos", `${px} ${py}`);
      card.style.setProperty("--angle", `${(mx * 360).toFixed(1)}deg`);
      card.style.transform = `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--mx", "0.5");
      card.style.setProperty("--my", "0.5");
      card.style.setProperty("--pos", "50% 50%");
      card.style.setProperty("--posx", "50%");
      card.style.setProperty("--posy", "50%");
      card.style.setProperty("--glare-pos", "50% 50%");
      card.style.setProperty("--angle", "0deg");
      card.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg)";
    });
  }
}

function cityCrestSrc(city) {
  if (city?.crest) return city.crest;
  if (city?.slug === "dimitrovgrad") return "public/herb_dimitrovgrad.jpg";
  return `public/herb_${city.slug}.png`;
}

async function applyRoute(push) {
  if (!state.manifest) return;
  const params = new URLSearchParams(location.search);
  const routeTheme = params.get("theme");
  if (routeTheme) applyTheme(routeTheme);
  const slug = params.get("city") || SINGLE_CITY_SLUG;
  if (!slug) {
    closeCity(false);
    return;
  }
  const city = state.manifest.cities.find((item) => item.slug === slug);
  if (!city) return;
  state.routeApplying = true;
  state.comparisonMode = SINGLE_CITY_MODE ? "city" : normalizeComparison(params.get("cmp") || params.get("compare"));
  state.activeBlocks = normalizeKeySet(params.get("blocks"), DEFAULT_BLOCK_KEYS, DEFAULT_BLOCK_KEYS);
  state.visibleLayers = normalizeKeySet(params.get("layers"), DEFAULT_LAYER_KEYS, ALL_LAYER_KEYS);
  state.debugMode = normalizeDebugMode(params.get("debug") || params.get("diag"));
  applyDebugLayerDefaults();
  await openCity(slug, push, {
    quarter: params.get("quarter") || params.get("q")
  });
  state.routeApplying = false;
}

async function openCity(slug, pushUrl, route = {}) {
  const city = state.manifest.cities.find((item) => item.slug === slug);
  if (!city) return;
  if (!state.routeApplying) {
    state.activeBlocks = new Set(DEFAULT_BLOCK_KEYS);
    state.visibleLayers = new Set(DEFAULT_LAYER_KEYS);
    state.comparisonMode = "city";
    state.debugMode = null;
  }
  state.activeCity = city;
  state.selectedFeature = null;
  state.methodCardKey = null;
  state.accidentPopup = null;
  state.accidentPopupCameraSignature = null;
  els.cityMenu.classList.add("hidden");
  els.mapShell.classList.remove("hidden");
  els.backButton.classList.toggle("hidden", SINGLE_CITY_MODE);
  els.pageTitle.textContent = city.name;
  document.title = SINGLE_CITY_MODE ? `${city.name} — 3D-карта индекса качества городской среды` : "3D-карта индекса качества городской среды";
  initViewer();
  clearScene();
  renderControls();
  showLoadingOverlay(city.name);
  setLoadingStage("layers");
  state.data = await loadCityData(city);
  setLoadingStage("layers", "done");
  recomputeScores();
  renderInfo();
  setLoadingStage("terrain");
  await loadBaseTilesets(city);
  setLoadingStage("terrain", "done");
  renderBaseLayers();
  selectQuarterById(route.quarter);
  renderQuartals();
  setLoadingStage("buildings");
  await setBuildingsVisible(state.visibleLayers.has("buildings"));
  setLoadingStage("buildings", "done");
  setLoadingStage("prepare");
  updateLayer("stops");
  updateLayer("dtp");
  renderLegends();
  renderTutorial();
  setupInfoPanelGestures();
  flyToCity(false);
  setLoadingStage("prepare", "done");
  hideLoading();
  if (pushUrl && !state.routeApplying) updateUrl();
}

async function loadCityData(city) {
  if (city.files?.layers && !city.files?.meta) {
    const layers = await fetchJson(city.files.layers);
    return {
      ...layers,
      stops: layers.stops || { items: [] },
      dtp: layers.dtp || { items: [] },
      greenVisible: layers.greenVisible || null,
      roadsMedium: layers.roadsMedium || { lines: [] },
      pointsLoaded: true,
      pointsPromise: null,
      roadsDetailLoaded: Boolean(layers.roadsAll?.lines?.length),
      roadsDetailPromise: null,
      trees: createTreeState(city, layers.trees?.items || [])
    };
  }
  const [meta, quartals, surfaces, roads, roadLabels] = await Promise.all([
    fetchJson(city.files.meta),
    fetchJson(city.files.quartals),
    fetchJson(city.files.surfaces),
    fetchJson(city.files.roads),
    fetchJson(city.files.roadLabels)
  ]);
  return {
    ...meta,
    quartals: quartals.quartals || [],
    green: surfaces.green || [],
    greenVisible: surfaces.greenVisible || null,
    water: surfaces.water || [],
    roads: roads.roads || { lines: [] },
    roadsMedium: roads.roadsMedium || { lines: [] },
    roadsAll: roads.roadsAll || { lines: [] },
    roadsDetailLoaded: Boolean(roads.roadsAll?.lines?.length),
    roadsDetailPromise: null,
    railways: roads.railways || { lines: [] },
    roadLabels: roadLabels.roadLabels || { labels: [] },
    stops: { items: [] },
    dtp: { items: [] },
    pointsLoaded: false,
    pointsPromise: null,
    trees: createTreeState(city)
  };
}

function createTreeState(city, legacyItems = null) {
  return {
    manifestUrl: city.files?.trees || null,
    manifest: null,
    manifestPromise: null,
    tilesByKey: new Map(),
    loadedTiles: new Map(),
    loadingTiles: new Set(),
    legacyItems
  };
}

async function ensurePointData() {
  if (!state.data || state.data.pointsLoaded) return state.data;
  if (state.data.pointsPromise) return state.data.pointsPromise;
  const city = state.activeCity;
  const pointsUrl = city?.files?.points;
  if (!pointsUrl) {
    state.data.pointsLoaded = true;
    return state.data;
  }
  state.data.pointsPromise = fetchJson(pointsUrl)
    .then((points) => {
      if (state.activeCity !== city || !state.data) return state.data;
      state.data.stops = points.stops || { items: [] };
      state.data.dtp = points.dtp || { items: [] };
      state.data.pointsLoaded = true;
      state.data.pointsPromise = null;
      return state.data;
    })
    .catch((error) => {
      if (state.data) state.data.pointsPromise = null;
      console.error(error);
      throw error;
    });
  return state.data.pointsPromise;
}

function rerenderVisiblePointLayers() {
  if (!state.data || (!state.visibleLayers.has("stops") && !state.visibleLayers.has("dtp"))) return;
  ensurePointData()
    .then(() => {
      if (!state.data) return;
      if (state.visibleLayers.has("stops")) renderPoints("stops", state.data?.stops?.items || [], stopStyle);
      if (state.visibleLayers.has("dtp")) renderAccidentsClustered();
    })
    .catch((error) => console.error(error));
}

function closeCity(pushUrl) {
  if (SINGLE_CITY_MODE && state.manifest) {
    void openCity(SINGLE_CITY_SLUG, false);
    return;
  }
  state.activeCity = null;
  state.data = null;
  state.selectedFeature = null;
  els.mapShell.classList.add("hidden");
  els.cityMenu.classList.remove("hidden");
  els.backButton.classList.add("hidden");
  els.pageTitle.textContent = "Города исследования";
  els.methodCard?.classList.add("hidden");
  if (pushUrl) history.pushState({}, "", location.pathname);
}

function initViewer() {
  if (state.viewer) return;
  const viewer = new Cesium.Viewer("cesiumContainer", {
    animation: false,
    timeline: false,
    baseLayer: false,
    imageryProvider: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    requestRenderMode: true,
    maximumRenderTimeChange: 0.25
  });
  viewer.imageryLayers.removeAll();
  viewer.scene.globe.show = false;
  if (viewer.scene.skyBox) viewer.scene.skyBox.show = false;
  viewer.scene.skyAtmosphere.show = false;
  viewer.scene.moon.show = false;
  viewer.scene.sun.show = false;
  viewer.scene.fog.enabled = false;
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
  viewer.scene.screenSpaceCameraController.minimumZoomDistance = CAMERA_MIN_ZOOM_DISTANCE;
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = CAMERA_MAX_ZOOM_DISTANCE;
  viewer.scene.screenSpaceCameraController.translateEventTypes = [];
  viewer.scene.screenSpaceCameraController.rotateEventTypes = [];
  viewer.scene.screenSpaceCameraController.tiltEventTypes = [];
  viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.PINCH];
  viewer.scene.screenSpaceCameraController.lookEventTypes = [];
  viewer.scene.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  if (viewer.scene.postProcessStages?.fxaa) viewer.scene.postProcessStages.fxaa.enabled = true;
  if ("msaaSamples" in viewer.scene) viewer.scene.msaaSamples = 4;
  state.viewer = viewer;
  installCameraPointerControls(viewer);
  applyTheme(state.theme);

  state.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  state.handler.setInputAction((movement) => handleMapClick(movement.position), Cesium.ScreenSpaceEventType.LEFT_CLICK);
  viewer.scene.postRender.addEventListener(() => {
    updateCompass();
    drawRoadLabels();
    updateLineWidths();
    updateTrees();
    if (state.visibleLayers.has("dtp") && state.accidentDisplayItems.length) drawAccidentCanvas(state.accidentDisplayItems);
    scheduleAccidentClusterUpdate();
    if (shouldCloseAccidentClusterPopupForCamera()) closeAccidentPopup();
    else updateAccidentPopupPosition();
  });
}

function installCameraPointerControls(viewer) {
  const canvas = viewer.scene.canvas;
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    cancelCameraInertia();
    const start = canvasPointerPosition(event);
    if (event.button === 0) {
      state.cameraPan = {
        pointerId: event.pointerId,
        lastPosition: start,
        moved: false,
        velocityX: 0,
        velocityY: 0
      };
      state.cameraOrbit = null;
    } else if (event.button === 1 || event.button === 2) {
      const { target, range } = currentCameraOrbit(start);
      state.cameraOrbit = {
        pointerId: event.pointerId,
        startPosition: start,
        lastPosition: start,
        startHeading: viewer.camera.heading,
        startPitch: viewer.camera.pitch,
        target,
        range,
        moved: false,
        velocityX: 0,
        velocityY: 0
      };
      state.cameraPan = null;
    } else {
      return;
    }
    canvas.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  canvas.addEventListener("pointermove", (event) => {
    const pan = state.cameraPan;
    const position = canvasPointerPosition(event);
    if (pan && pan.pointerId === event.pointerId) {
      const dx = position.x - pan.lastPosition.x;
      const dy = position.y - pan.lastPosition.y;
      if (Math.hypot(dx, dy) >= 0.1) {
        panCameraByPixels(dx, dy);
        pan.lastPosition = position;
        pan.moved = true;
        pan.velocityX = clamp(dx, -CAMERA_INERTIA_MAX_PIXELS, CAMERA_INERTIA_MAX_PIXELS);
        pan.velocityY = clamp(dy, -CAMERA_INERTIA_MAX_PIXELS, CAMERA_INERTIA_MAX_PIXELS);
        requestSceneRender();
      }
      event.preventDefault();
      return;
    }
    const orbit = state.cameraOrbit;
    if (!orbit || orbit.pointerId !== event.pointerId) return;
    const dx = position.x - orbit.startPosition.x;
    const dy = position.y - orbit.startPosition.y;
    const stepDx = position.x - orbit.lastPosition.x;
    const stepDy = position.y - orbit.lastPosition.y;
    const heading = orbit.startHeading + dx * 0.006;
    const pitch = clamp(
      orbit.startPitch - dy * 0.004,
      Cesium.Math.toRadians(CAMERA_MIN_PITCH_DEG),
      Cesium.Math.toRadians(CAMERA_MAX_PITCH_DEG)
    );
    const range = Math.max(orbit.range, CAMERA_MIN_ZOOM_DISTANCE);
    viewer.camera.lookAt(orbit.target, new Cesium.HeadingPitchRange(heading, pitch, range));
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    if (Math.hypot(dx, dy) > 2) orbit.moved = true;
    orbit.lastPosition = position;
    orbit.velocityX = clamp(stepDx, -CAMERA_INERTIA_MAX_PIXELS, CAMERA_INERTIA_MAX_PIXELS);
    orbit.velocityY = clamp(stepDy, -CAMERA_INERTIA_MAX_PIXELS, CAMERA_INERTIA_MAX_PIXELS);
    requestSceneRender();
    event.preventDefault();
  }, { passive: false });
  const stopDrag = (event) => {
    const pan = state.cameraPan;
    const orbit = state.cameraOrbit;
    if (pan?.pointerId === event.pointerId) {
      if (pan.moved) state.suppressClickUntil = performance.now() + 250;
      if (pan.moved) {
        startCameraInertia({ type: "pan", velocityX: pan.velocityX, velocityY: pan.velocityY });
      }
      state.cameraPan = null;
    }
    if (orbit?.pointerId === event.pointerId) {
      if (orbit.moved) state.suppressClickUntil = performance.now() + 250;
      if (orbit.moved) {
        startCameraInertia({
          type: "orbit",
          target: Cesium.Cartesian3.clone(orbit.target),
          range: Math.max(orbit.range, CAMERA_MIN_ZOOM_DISTANCE),
          velocityX: orbit.velocityX,
          velocityY: orbit.velocityY
        });
      }
      state.cameraOrbit = null;
    }
    canvas.releasePointerCapture?.(event.pointerId);
  };
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("wheel", handleCameraWheel, { passive: false });
}

function handleCameraWheel(event) {
  if (!state.viewer || !state.activeCity) return;
  cancelCameraInertia();
  const wheelDelta = clamp(event.deltaY, -CAMERA_WHEEL_MAX_DELTA, CAMERA_WHEEL_MAX_DELTA);
  if (!Number.isFinite(wheelDelta) || Math.abs(wheelDelta) < 0.01) return;
  const position = canvasPointerPosition(event);
  const { target, range } = currentCameraOrbit(position);
  const zoomFactor = Math.exp(wheelDelta * CAMERA_WHEEL_ZOOM_RATE);
  const nextRange = clamp(range * zoomFactor, CAMERA_MIN_ZOOM_DISTANCE, CAMERA_MAX_ZOOM_DISTANCE);
  const camera = state.viewer.camera;
  const pitch = clamp(
    camera.pitch,
    Cesium.Math.toRadians(CAMERA_MIN_PITCH_DEG),
    Cesium.Math.toRadians(CAMERA_MAX_PITCH_DEG)
  );
  camera.lookAt(target, new Cesium.HeadingPitchRange(camera.heading, pitch, nextRange));
  camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  requestSceneRender();
  event.preventDefault();
}

function startCameraInertia(nextInertia) {
  cancelCameraInertia();
  const speed = Math.hypot(nextInertia.velocityX || 0, nextInertia.velocityY || 0);
  if (!Number.isFinite(speed) || speed < CAMERA_INERTIA_MIN_SPEED) return;
  state.cameraInertia = {
    ...nextInertia,
    velocityX: clamp(nextInertia.velocityX || 0, -CAMERA_INERTIA_MAX_PIXELS, CAMERA_INERTIA_MAX_PIXELS),
    velocityY: clamp(nextInertia.velocityY || 0, -CAMERA_INERTIA_MAX_PIXELS, CAMERA_INERTIA_MAX_PIXELS)
  };
  state.cameraInertiaFrame = requestAnimationFrame(stepCameraInertia);
}

function stepCameraInertia() {
  const inertia = state.cameraInertia;
  state.cameraInertiaFrame = null;
  if (!inertia || !state.viewer) return;
  if (inertia.type === "pan") {
    panCameraByPixels(inertia.velocityX, inertia.velocityY);
  } else if (inertia.type === "orbit") {
    orbitCameraByPixels(inertia.target, inertia.range, inertia.velocityX, inertia.velocityY);
  }
  inertia.velocityX *= CAMERA_INERTIA_DECAY;
  inertia.velocityY *= CAMERA_INERTIA_DECAY;
  requestSceneRender();
  if (Math.hypot(inertia.velocityX, inertia.velocityY) >= CAMERA_INERTIA_MIN_SPEED) {
    state.cameraInertiaFrame = requestAnimationFrame(stepCameraInertia);
  } else {
    state.cameraInertia = null;
  }
}

function cancelCameraInertia() {
  if (state.cameraInertiaFrame) {
    cancelAnimationFrame(state.cameraInertiaFrame);
    state.cameraInertiaFrame = null;
  }
  state.cameraInertia = null;
}

function panCameraByPixels(dx, dy) {
  if (!state.viewer || !state.activeCity) return;
  const camera = state.viewer.camera;
  const normal = cameraGroundNormal();
  const right = projectToTangent(camera.rightWC, normal);
  let up = projectToTangent(camera.upWC, normal);
  if (!up && right) {
    up = Cesium.Cartesian3.cross(right, normal, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(up, up);
  }
  if (!right || !up) return;
  const metersPerPixel = cameraPanMetersPerPixel();
  const rightMove = Cesium.Cartesian3.multiplyByScalar(right, -dx * metersPerPixel, new Cesium.Cartesian3());
  const upMove = Cesium.Cartesian3.multiplyByScalar(up, dy * metersPerPixel, new Cesium.Cartesian3());
  const delta = Cesium.Cartesian3.add(rightMove, upMove, new Cesium.Cartesian3());
  camera.position = Cesium.Cartesian3.add(camera.position, delta, new Cesium.Cartesian3());
}

function orbitCameraByPixels(target, range, dx, dy) {
  if (!state.viewer || !target) return;
  const camera = state.viewer.camera;
  const heading = camera.heading + dx * 0.006;
  const pitch = clamp(
    camera.pitch - dy * 0.004,
    Cesium.Math.toRadians(CAMERA_MIN_PITCH_DEG),
    Cesium.Math.toRadians(CAMERA_MAX_PITCH_DEG)
  );
  camera.lookAt(target, new Cesium.HeadingPitchRange(heading, pitch, Math.max(range, CAMERA_MIN_ZOOM_DISTANCE)));
  camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
}

function cameraPanMetersPerPixel() {
  const canvas = state.viewer.scene.canvas;
  const viewport = Math.max(1, Math.min(canvas.clientWidth || 1, canvas.clientHeight || 1));
  return clamp(
    (cameraZoomMetric() / viewport) * CAMERA_PAN_SPEED_FACTOR,
    CAMERA_PAN_MIN_METERS_PER_PIXEL,
    CAMERA_PAN_MAX_METERS_PER_PIXEL
  );
}

function cameraGroundNormal() {
  const anchor = cameraGroundAnchorPoint();
  return Cesium.Cartesian3.normalize(anchor, new Cesium.Cartesian3());
}

function cameraGroundAnchorPoint() {
  const cartographic = state.viewer?.camera?.positionCartographic;
  if (
    cartographic
    && Number.isFinite(cartographic.longitude)
    && Number.isFinite(cartographic.latitude)
  ) {
    return Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cityGroundHeight());
  }
  return Cesium.Cartesian3.fromDegrees(state.activeCity.center[0], state.activeCity.center[1], cityGroundHeight());
}

function projectToTangent(vector, normal) {
  if (!vector || !normal) return null;
  const normalPart = Cesium.Cartesian3.multiplyByScalar(
    normal,
    Cesium.Cartesian3.dot(vector, normal),
    new Cesium.Cartesian3()
  );
  const projected = Cesium.Cartesian3.subtract(vector, normalPart, new Cesium.Cartesian3());
  const magnitude = Cesium.Cartesian3.magnitude(projected);
  if (!Number.isFinite(magnitude) || magnitude < 1e-6) return null;
  return Cesium.Cartesian3.divideByScalar(projected, magnitude, projected);
}

function currentCameraOrbit(pointerPosition) {
  const target = currentCameraOrbitTarget(pointerPosition);
  const camera = state.viewer.camera;
  const rawRange = Cesium.Cartesian3.distance(camera.positionWC, target);
  if (!Number.isFinite(rawRange) || rawRange <= 0) {
    return {
      target: Cesium.Cartesian3.fromDegrees(state.activeCity.center[0], state.activeCity.center[1], cityGroundHeight()),
      range: CAMERA_MIN_ZOOM_DISTANCE
    };
  }
  const stableRange = stableCameraOrbitRange(rawRange);
  if (Number.isFinite(stableRange) && rawRange > stableRange * 1.35) {
    const offset = Cesium.Cartesian3.multiplyByScalar(camera.directionWC, stableRange, new Cesium.Cartesian3());
    return {
      target: Cesium.Cartesian3.add(camera.positionWC, offset, new Cesium.Cartesian3()),
      range: stableRange
    };
  }
  return { target, range: rawRange };
}

function stableCameraOrbitRange(rawRange) {
  const camera = state.viewer?.camera;
  const cartographic = camera?.positionCartographic;
  if (!cartographic || !Number.isFinite(cartographic.height)) return rawRange;
  const heightAboveCity = Math.max(0, cartographic.height - cityGroundHeight());
  const pitchFactor = Math.max(0.12, Math.abs(Math.sin(camera.pitch)));
  const heightRange = Math.max(1, heightAboveCity / pitchFactor);
  return Math.max(CAMERA_MIN_ZOOM_DISTANCE, Math.min(rawRange, heightRange * 1.25 + 30));
}

function currentCameraOrbitTarget(pointerPosition) {
  const canvas = state.viewer.scene.canvas;
  const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
  return pickCameraControlPlane(center)
    || pickCameraControlPlane(pointerPosition)
    || Cesium.Cartesian3.fromDegrees(state.activeCity.center[0], state.activeCity.center[1], cityGroundHeight());
}

function canvasPointerPosition(event) {
  const rect = state.viewer.scene.canvas.getBoundingClientRect();
  return new Cesium.Cartesian2(event.clientX - rect.left, event.clientY - rect.top);
}

function pickCameraControlPlane(position) {
  if (!state.viewer || !state.activeCity) return null;
  const ray = state.viewer.camera.getPickRay(position);
  if (!ray) return null;
  const center = Cesium.Cartesian3.fromDegrees(state.activeCity.center[0], state.activeCity.center[1], cityGroundHeight());
  const normal = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());
  const plane = Cesium.Plane.fromPointNormal(center, normal);
  return Cesium.IntersectionTests.rayPlane(ray, plane, new Cesium.Cartesian3());
}

function clearScene() {
  if (!state.viewer) return;
  stopSelectedPulse();
  cancelCameraInertia();
  cancelQuartalColorAnimation();
  state.viewer.entities.removeAll();
  for (const primitive of state.tilesets.values()) {
    if (primitive && !primitive.isDestroyed?.()) state.viewer.scene.primitives.remove(primitive);
  }
  for (const list of state.primitiveGroups.values()) {
    for (const primitive of list) removeScenePrimitive(primitive);
  }
  for (const dataSource of state.dataSources.values()) {
    state.viewer.dataSources.remove(dataSource, true);
  }
  state.entities.clear();
  state.dataSources.clear();
  state.primitiveGroups.clear();
  state.tilesets.clear();
  state.lastLineStyleFactor = null;
  state.lastRoadDetailSignature = null;
  state.lastRoadLabelVisible = null;
  state.lastTreeStyle = null;
  window.clearTimeout(state.treeRefreshTimer);
  state.treeRefreshTimer = null;
  state.treeTilesetPromise = null;
  resetAccidentAnimation();
  requestSceneRender();
}

async function loadBaseTilesets(city) {
  if (!SHOW_TERRAIN_SURFACE) return;
  if (city.files.terrainTileset) {
    const terrain = await loadTileset(city.files.terrainTileset, { maximumScreenSpaceError: 12 });
    terrain.lifeKind = "terrain";
    state.tilesets.set("terrain", terrain);
  }
}

async function setBuildingsVisible(visible) {
  const profile = buildingTilesetProfile();
  const current = state.tilesets.get("buildings");
  if (current) {
    if (visible && current.lifeProfile !== profile) {
      removeScenePrimitive(current);
      state.tilesets.delete("buildings");
    } else {
      current.show = visible;
      if (visible) {
        applyBuildingDebug(current);
        applyBuildingTheme();
        raiseBuildingsToTop();
      }
      requestSceneRender();
      return;
    }
  }
  const tilesetUrl = buildingTilesetUrl();
  if (!visible || !tilesetUrl) return;
  let tileset;
  try {
    tileset = await loadTileset(tilesetUrl, buildingTilesetOptions());
  } catch (error) {
    console.error("Unable to load building tileset", error);
    return;
  }
  tileset.lifeKind = "buildings";
  tileset.lifeProfile = profile;
  applyTilesetHeightOffset(tileset, BUILDING_Z_OFFSET);
  state.tilesets.set("buildings", tileset);
  applyBuildingDebug(tileset);
  applyBuildingTheme();
  raiseBuildingsToTop();
  requestSceneRender();
}

function applyBuildingDebug(tileset) {
  if (!tileset) return;
  const showBounds = state.debugMode === "tile-bounds";
  tileset.debugShowBoundingVolume = showBounds;
  tileset.debugShowContentBoundingVolume = showBounds;
}

function buildingTilesetProfile() {
  return isMobileViewport() && state.activeCity?.files.buildingsMobileTileset ? "mobile" : "desktop";
}

function buildingTilesetUrl() {
  if (!state.activeCity) return null;
  return buildingTilesetProfile() === "mobile"
    ? state.activeCity.files.buildingsMobileTileset || state.activeCity.files.buildingsTileset
    : state.activeCity.files.buildingsTileset;
}

function buildingTilesetOptions() {
  if (!isMobileViewport()) {
    return {
      maximumScreenSpaceError: DESKTOP_BUILDING_SSE,
      skipLevelOfDetail: false,
      cullRequestsWhileMoving: false,
      cullWithChildrenBounds: false,
      immediatelyLoadDesiredLevelOfDetail: false,
      loadSiblings: true,
      preloadFlightDestinations: true,
      cacheBytes: 160 * 1024 * 1024,
      maximumCacheOverflowBytes: 64 * 1024 * 1024
    };
  }
  return {
    maximumScreenSpaceError: MOBILE_BUILDING_SSE,
    dynamicScreenSpaceError: true,
    dynamicScreenSpaceErrorDensity: 0.003,
    dynamicScreenSpaceErrorFactor: 3,
    skipLevelOfDetail: false,
    cullRequestsWhileMoving: false,
    cullWithChildrenBounds: false,
    immediatelyLoadDesiredLevelOfDetail: false,
    loadSiblings: false,
    preloadFlightDestinations: true,
    cacheBytes: 112 * 1024 * 1024,
    maximumCacheOverflowBytes: 48 * 1024 * 1024
  };
}

function applyLoadingProfile() {
  const buildings = state.tilesets.get("buildings");
  if (buildings) {
    const options = buildingTilesetOptions();
    buildings.maximumScreenSpaceError = options.maximumScreenSpaceError;
    if (buildings.lifeProfile !== buildingTilesetProfile() && state.visibleLayers.has("buildings")) {
      setBuildingsVisible(true);
    }
  }
  if (isMobileViewport()) {
    clearEntities("roadsDetail");
  } else if (state.data?.roadsDetailLoaded && roadDetailProgress() > 0.02) {
    renderDetailedRoads();
  }
}

function applyBuildingTheme() {
  const tileset = state.tilesets.get("buildings");
  if (!tileset) return;
  try {
    if (state.theme === "dark") {
      tileset.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.MIX;
      tileset.colorBlendAmount = 0.12;
      tileset.style = new Cesium.Cesium3DTileStyle({
        color: "color('#151b1c')"
      });
    } else {
      tileset.style = undefined;
      tileset.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.HIGHLIGHT;
      tileset.colorBlendAmount = 0.5;
    }
  } catch (error) {
    console.warn("Unable to apply building theme", error);
  }
}

function applyTreeTheme() {
  const tileset = state.tilesets.get("trees");
  if (!tileset) return;
  try {
    if (state.theme === "dark") {
      tileset.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.MIX;
      tileset.colorBlendAmount = 0.44;
      tileset.style = new Cesium.Cesium3DTileStyle({
        color: "color('#121e17')"
      });
    } else {
      tileset.style = undefined;
      tileset.colorBlendMode = Cesium.Cesium3DTileColorBlendMode.HIGHLIGHT;
      tileset.colorBlendAmount = 0.08;
    }
  } catch (error) {
    console.warn("Unable to apply tree theme", error);
  }
}

function applyTilesetHeightOffset(tileset, meters) {
  if (!tileset || !state.activeCity || !meters) return;
  const center = Cesium.Cartesian3.fromDegrees(state.activeCity.center[0], state.activeCity.center[1], 0);
  const up = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());
  const translation = Cesium.Cartesian3.multiplyByScalar(up, meters, new Cesium.Cartesian3());
  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
}

async function loadTileset(url, options = {}) {
  const stage = url.includes("buildings") ? "buildings" : url.includes("trees-3d") ? null : "terrain";
  if (stage) setLoadingStage(stage);
  const tileset = Cesium.Cesium3DTileset.fromUrl
    ? await Cesium.Cesium3DTileset.fromUrl(url, options)
    : new Cesium.Cesium3DTileset({ url, ...options });
  state.viewer.scene.primitives.add(tileset);
  requestSceneRender();
  return tileset;
}

function raiseBuildingsToTop() {
  const tileset = state.tilesets.get("buildings");
  if (!tileset || !state.viewer) return;
  try {
    state.viewer.scene.primitives.raiseToTop(tileset);
  } catch (error) {}
}

function raisePrimitiveGroupToTop(key) {
  if (!state.viewer) return;
  for (const primitive of state.primitiveGroups.get(key) || []) {
    try {
      state.viewer.scene.primitives.raiseToTop(primitive);
    } catch (error) {}
  }
}

function applyMapLayerOrder() {
  if (!state.viewer) return;
  for (const key of ["quartals", "green", "water", "roadsDetail", "roadsMedium", "roads", "railways"]) {
    raisePrimitiveGroupToTop(key);
  }
  const trees = state.tilesets.get("trees");
  if (trees) {
    try {
      state.viewer.scene.primitives.raiseToTop(trees);
    } catch (error) {}
  }
  raiseBuildingsToTop();
}

function renderControls() {
  const isMobile = isMobileViewport();
  disableMobileTrees();
  const userLayers = isMobile ? USER_LAYERS.filter((layer) => layer.key !== "trees") : USER_LAYERS;
  els.scenarioControls.classList.toggle("collapsed", isMobile);
  els.layerControls.classList.toggle("collapsed", isMobile);
  els.scenarioControls.innerHTML = `
    <button class="controlPanelTitle" type="button" aria-expanded="${isMobile ? "false" : "true"}">Сценарии индекса</button>
    <div class="controlPanelBody">
      ${BLOCKS.map(renderScenarioToggle).join("")}
    </div>
  `;
  els.layerControls.innerHTML = `
    <button class="controlPanelTitle" type="button" aria-expanded="${isMobile ? "false" : "true"}">Слои</button>
    <div class="controlPanelBody">
      ${userLayers.map((layer) => `
        <label class="toggle">
          <input type="checkbox" data-layer="${layer.key}" ${state.visibleLayers.has(layer.key) ? "checked" : ""}>
          <span>${escapeHtml(layer.label)}</span>
        </label>
      `).join("")}
    </div>
  `;
  els.scenarioControls.onchange = (event) => {
    const input = event.target.closest("[data-block]");
    if (!input) return;
    if (input.disabled) return;
    if (input.checked) state.activeBlocks.add(input.dataset.block);
    else state.activeBlocks.delete(input.dataset.block);
    recomputeScores();
    renderQuartals();
    renderInfo();
    updateUrl();
  };
  els.layerControls.onchange = (event) => {
    const input = event.target.closest("[data-layer]");
    if (!input) return;
    if (input.checked) state.visibleLayers.add(input.dataset.layer);
    else state.visibleLayers.delete(input.dataset.layer);
    updateLayer(input.dataset.layer);
    renderLegends();
    updateUrl();
  };
  for (const panel of [els.scenarioControls, els.layerControls]) {
    const title = panel.querySelector(".controlPanelTitle");
    title.onclick = () => {
      panel.classList.toggle("collapsed");
      title.setAttribute("aria-expanded", String(!panel.classList.contains("collapsed")));
    };
  }
}

function renderScenarioToggle(block) {
  const disabled = isCommerceDisabledInComparison(block.key);
  const tooltip = disabled ? "Экономика не участвует в общегородском сравнении" : block.help;
  return `
    <label class="toggle${disabled ? " isDisabled" : ""}" data-tooltip="${escapeAttr(tooltip)}">
      <input type="checkbox" data-block="${block.key}" ${state.activeBlocks.has(block.key) ? "checked" : ""} ${disabled ? "disabled" : ""}>
      <span style="--accent:${block.color}">${escapeHtml(block.label)}</span>
    </label>
  `;
}

function renderBaseLayers() {
  renderGreenLayer();
  if (!debugSkipsBaseLayer("water")) renderPolygons("water", state.data.water, themeColor("waterFill"));
  if (!debugSkipsBaseLayer("roadsDetail")) renderDetailedRoads();
  if (!debugSkipsBaseLayer("roadsMedium")) renderLines("roadsMedium", state.data.roadsMedium?.lines || [], themeColor("roadMedium"), 2.35);
  if (!debugSkipsBaseLayer("roads")) renderLines("roads", state.data.roads.lines, themeColor("roadMain"), 4.2);
  if (!debugSkipsBaseLayer("railways")) renderRailways();
  if (!debugSkipsBaseLayer("roadLabels")) renderRoadLabels();
  if (!debugSkipsLayer("trees")) updateTrees(true);
  applyMapLayerOrder();
}

function renderBaseLayerColors() {
  if (!state.data) return;
  for (const key of ["green", "water", "roadsDetail", "roadsMedium", "roads", "railways", "roadLabels"]) clearEntities(key);
  renderBaseLayers();
  renderLegends();
}

function renderGreenLayer() {
  if (debugSkipsBaseLayer("green")) {
    clearEntities("green");
    return;
  }
  renderPolygons("green", visibleGreenFeatures(), themeColor("greenFill"));
}

function visibleGreenFeatures() {
  if (!state.data) return [];
  if (state.visibleLayers.has("quartals") && Array.isArray(state.data.greenVisible)) return state.data.greenVisible;
  return state.data.green || [];
}

function updateLayer(key) {
  if (debugSkipsLayer(key)) {
    clearEntities(key);
    if (key === "trees") setTreeTilesetVisible(false);
    return;
  }
  if (key === "buildings") {
    setBuildingsVisible(state.visibleLayers.has("buildings"));
    return;
  }
  clearEntities(key);
  if (key === "quartals") renderGreenLayer();
  if (!state.visibleLayers.has(key)) return;
  if (key === "quartals") renderQuartals();
  if (key === "trees") updateTrees(true);
  if (key === "stops") {
    ensurePointData()
      .then(() => {
        if (state.visibleLayers.has("stops")) renderPoints("stops", state.data?.stops?.items || [], stopStyle);
      })
      .catch((error) => console.error(error));
  }
  if (key === "dtp") {
    ensurePointData()
      .then(() => {
        if (state.visibleLayers.has("dtp")) renderAccidentsClustered();
      })
      .catch((error) => console.error(error));
  }
}

function renderQuartals() {
  cancelQuartalColorAnimation();
  clearEntities("quartals");
  clearEntities("selectedQuarter");
  stopSelectedPulse();
  if (!state.data || !state.visibleLayers.has("quartals") || debugSkipsLayer("quartals")) {
    renderLegends();
    requestSceneRender();
    return;
  }
  const instances = [];
  const colorAnimations = [];
  let instanceIndex = 0;
  for (const feature of state.data.quartals) {
    for (const polygon of feature.polygons || []) {
      const geometry = polygonGeometryFromPolygon(polygon, QUARTAL_Z_OFFSET);
      if (!geometry) continue;
      const previousScore = feature.properties.previousScore;
      const currentScore = feature.properties.currentScore;
      const shouldAnimate = Number.isFinite(previousScore)
        && Number.isFinite(currentScore)
        && Math.abs(previousScore - currentScore) > 0.01;
      const instanceId = { lifeFeature: feature, lifeQuartalInstance: `${feature.id}:${instanceIndex}` };
      const startScore = shouldAnimate ? previousScore : currentScore;
      const startColor = Cesium.Color.fromCssColorString(scoreColor(startScore, QUARTAL_ALPHA));
      const targetColor = Cesium.Color.fromCssColorString(scoreColor(currentScore, QUARTAL_ALPHA));
      instances.push(new Cesium.GeometryInstance({
        geometry,
        id: instanceId,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(startColor)
        }
      }));
      if (shouldAnimate) colorAnimations.push({ id: instanceId, from: startColor, to: targetColor });
      instanceIndex += 1;
    }
    delete feature.properties.previousScore;
  }
  const primitive = addColorPolygonPrimitive("quartals", instances, { asynchronous: false });
  if (primitive && colorAnimations.length) animateQuartalColors(primitive, colorAnimations);
  renderSelectedQuarter();
  applyMapLayerOrder();
  renderLegends();
  requestSceneRender();
}

function animateQuartalColors(primitive, items) {
  cancelQuartalColorAnimation();
  const startedAt = performance.now();
  const scratch = new Cesium.Color();
  const step = () => {
    const elapsed = performance.now() - startedAt;
    const t = smoothStep(clamp(elapsed / QUARTAL_COLOR_ANIMATION_MS, 0, 1));
    for (const item of items) {
      let attributes = null;
      try {
        attributes = primitive.getGeometryInstanceAttributes(item.id);
      } catch (error) {
        attributes = null;
      }
      if (!attributes?.color) continue;
      Cesium.Color.lerp(item.from, item.to, t, scratch);
      attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(scratch, attributes.color);
    }
    requestSceneRender();
    if (t < 1 && !primitive.isDestroyed?.()) {
      state.quartalColorAnimation = requestAnimationFrame(step);
    } else {
      state.quartalColorAnimation = null;
    }
  };
  state.quartalColorAnimation = requestAnimationFrame(step);
}

function cancelQuartalColorAnimation() {
  if (!state.quartalColorAnimation) return;
  cancelAnimationFrame(state.quartalColorAnimation);
  state.quartalColorAnimation = null;
}

function renderPolygons(key, features, fill) {
  clearEntities(key);
  const instances = [];
  const zOffset = key === "green" ? GREEN_POLYGON_Z_OFFSET : SURFACE_POLYGON_Z_OFFSET;
  const useGreenFallbackClip = key === "green" && state.visibleLayers.has("quartals") && !Array.isArray(state.data?.greenVisible);
  for (const feature of features || []) {
    for (const polygon of feature.polygons || []) {
      if (useGreenFallbackClip && greenPolygonInsideQuartal(polygon)) continue;
      const geometry = polygonGeometryFromPolygon(polygon, zOffset);
      if (!geometry) continue;
      instances.push(new Cesium.GeometryInstance({
        geometry,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromCssColorString(fill))
        }
      }));
    }
  }
  addColorPolygonPrimitive(key, instances, {
    asynchronous: false,
    surfaceOverlay: key === "green" || key === "water"
  });
  applyMapLayerOrder();
  requestSceneRender();
}

function greenPolygonInsideQuartal(polygon) {
  if (!state.data?.quartals?.length) return false;
  const bbox = polygonProjectedBbox(polygon);
  const point = polygonRepresentativePoint(polygon);
  if (!bbox || !point) return false;
  return state.data.quartals.some((feature) => {
    for (const quarterPolygon of feature.polygons || []) {
      const quarterBbox = polygonProjectedBbox(quarterPolygon) || feature.bbox;
      if (!bboxContainsBbox(quarterBbox, bbox, 0.00002)) continue;
      if (pointInProjectedPolygon(point, quarterPolygon)) return true;
    }
    return false;
  });
}

function renderDetailedRoads() {
  if (isMobileViewport()) return;
  const progress = roadDetailProgress();
  if (progress <= 0.01) {
    if ((state.primitiveGroups.get("roadsDetail") || []).length) clearEntities("roadsDetail");
    state.lastRoadDetailSignature = null;
    return;
  }
  if (!state.data?.roadsDetailLoaded) {
    if (state.data?.roadsDetailPromise) return;
    ensureRoadDetailData()
      .then(() => renderDetailedRoads())
      .catch((error) => console.error(error));
    return;
  }
  const view = roadDetailViewState();
  const styleBucket = Math.round(progress * 14);
  const signature = `${state.theme}:${view.signature}:${styleBucket}`;
  if (state.lastRoadDetailSignature === signature) return;
  const lines = visibleRoadDetailLines(state.data.roadsAll?.lines || [], view);
  clearEntities("roadsDetail");
  state.lastRoadDetailSignature = signature;
  if (!lines.length) return;
  addPolylineCollection("roadsDetail", lines, {
    color: roadDetailColor(roadDetailAlpha(progress)),
    width: detailRoadWidth(progress),
    dynamicRoadDetail: true,
    zOffset: ROAD_Z_OFFSET - 0.04
  });
}

function visibleRoadDetailLines(lines, view) {
  if (!lines?.length) return [];
  const bbox = roadDetailViewBbox(view);
  if (!bbox) return lines.slice(0, ROAD_DETAIL_MAX_LINES);
  const result = [];
  for (const line of lines) {
    if (!line || line.length < 2) continue;
    if (!lineIntersectsBbox(line, bbox)) continue;
    result.push(line);
    if (result.length >= ROAD_DETAIL_MAX_LINES) break;
  }
  return result;
}

function lineIntersectsBbox(line, bbox) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of line) {
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }
  return Number.isFinite(minX) && bboxesIntersect([minX, minY, maxX, maxY], bbox);
}

function roadDetailViewState() {
  if (!state.viewer || !state.activeCity) {
    return { center: null, radius: ROAD_DETAIL_RENDER_RADIUS_MAX, signature: "none" };
  }
  const canvas = state.viewer.scene.canvas;
  const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
  const target = currentCameraOrbit(center).target
    || Cesium.Cartesian3.fromDegrees(state.activeCity.center[0], state.activeCity.center[1], cityGroundHeight());
  const carto = Cesium.Cartographic.fromCartesian(target);
  const lon = Cesium.Math.toDegrees(carto.longitude);
  const lat = Cesium.Math.toDegrees(carto.latitude);
  const radius = clamp(cameraZoomMetric() * 0.72, ROAD_DETAIL_RENDER_RADIUS_MIN, ROAD_DETAIL_RENDER_RADIUS_MAX);
  const metersPerLon = 111320 * Math.max(0.2, Math.cos(carto.latitude));
  const lonBucket = Math.round((lon * metersPerLon) / ROAD_DETAIL_VIEW_SIGNATURE_STEP_M);
  const latBucket = Math.round((lat * 111320) / ROAD_DETAIL_VIEW_SIGNATURE_STEP_M);
  const radiusBucket = Math.round(radius / ROAD_DETAIL_RADIUS_SIGNATURE_STEP_M);
  return {
    center: [lon, lat, 0],
    radius,
    lon,
    lat,
    signature: `${lonBucket}:${latBucket}:${radiusBucket}`
  };
}

function roadDetailViewBbox(view) {
  if (!view?.center) return null;
  const radius = view.radius;
  const latRad = view.lat * Math.PI / 180;
  const latDelta = radius / 111320;
  const lonDelta = radius / (111320 * Math.max(0.2, Math.cos(latRad)));
  return [view.lon - lonDelta, view.lat - latDelta, view.lon + lonDelta, view.lat + latDelta];
}

async function ensureRoadDetailData() {
  if (!state.data || state.data.roadsDetailLoaded) return state.data;
  if (isMobileViewport()) return state.data;
  if (state.data.roadsDetailPromise) return state.data.roadsDetailPromise;
  const city = state.activeCity;
  const url = city?.files?.roadsDetail;
  if (!url) {
    state.data.roadsDetailLoaded = true;
    return state.data;
  }
  state.data.roadsDetailPromise = fetchJson(url)
    .then((payload) => {
      if (state.activeCity !== city || !state.data) return state.data;
      state.data.roadsAll = payload.roadsAll || { lines: [] };
      state.data.roadsDetailLoaded = true;
      state.data.roadsDetailPromise = null;
      return state.data;
    })
    .catch((error) => {
      if (state.data) state.data.roadsDetailPromise = null;
      throw error;
    });
  return state.data.roadsDetailPromise;
}

function renderLines(key, lines, color, width) {
  clearEntities(key);
  addPolylineCollection(key, lines || [], {
    color,
    width,
    dynamicWidth: true,
    dynamicRoadMain: key === "roads",
    zOffset: ROAD_Z_OFFSET
  });
  updateLineWidths(true);
  requestSceneRender();
}

function renderRailways() {
  clearEntities("railways");
  const lines = state.data.railways?.lines || [];
  addPolylineCollection("railways", lines, { color: themeColor("railway"), width: 3.15, dynamicWidth: true, zOffset: RAILWAY_Z_OFFSET });
  addPolylineCollection("railways", splitLinesIntoDashes(lines, 22, 16), {
    color: themeColor("railwayDash"),
    width: 1.55,
    dynamicWidth: true,
    zOffset: RAILWAY_Z_OFFSET + 0.08
  });
  updateLineWidths(true);
  requestSceneRender();
}

function updateLineWidths(force = false) {
  if (!state.viewer) return;
  const zoomMetric = cameraZoomMetric();
  const factor = roadWidthFactor(zoomMetric);
  const detailProgress = roadDetailProgress(zoomMetric);
  const detailAlpha = roadDetailAlpha(detailProgress);
  const detailWidth = detailRoadWidth(detailProgress);
  if (!isMobileViewport() && detailProgress > 0.02) {
    renderDetailedRoads();
  } else if ((state.primitiveGroups.get("roadsDetail") || []).length) {
    clearEntities("roadsDetail");
  }
  const previous = state.lastLineStyleFactor;
  if (
    !force
    && previous
    && Math.abs(previous.factor - factor) < LINE_STYLE_EPS
    && Math.abs(previous.detailAlpha - detailAlpha) < 0.015
    && Math.abs(previous.detailWidth - detailWidth) < 0.04
  ) return;
  state.lastLineStyleFactor = { factor, detailAlpha, detailWidth };
  for (const key of ["roadsDetail", "roads", "railways"]) {
    for (const primitive of state.primitiveGroups.get(key) || []) {
      if (primitive.lifeKind !== "polylineCollection" && primitive.lifeKind !== "roundPointCollection") continue;
      if (primitive.lifeDynamicRoadDetail) {
        primitive.show = detailAlpha > 0.002;
        if (primitive.lifeMaterial?.uniforms) {
          primitive.lifeMaterial.uniforms.color = Cesium.Color.fromCssColorString(roadDetailColor(detailAlpha));
        }
      }
      if (primitive.lifeDynamicRoadMain && primitive.lifeMaterial?.uniforms) {
        primitive.lifeMaterial.uniforms.color = Cesium.Color.fromCssColorString(roadMainColor(factor));
      }
      if (!primitive.lifeDynamicWidth && !primitive.lifeDynamicRoadDetail) continue;
      const width = primitive.lifeDynamicRoadDetail ? detailWidth : Math.max(0.8, primitive.lifeBaseWidth * factor);
      if (primitive.lifeKind === "roundPointCollection") {
        const color = Cesium.Color.fromCssColorString(primitive.lifeDynamicRoadMain ? roadMainColor(factor) : primitive.lifeColorCss);
        for (let i = 0; i < primitive.length; i += 1) {
          const point = primitive.get(i);
          point.pixelSize = width * 1.04;
          point.color = color;
        }
        continue;
      }
      for (let i = 0; i < primitive.length; i += 1) {
        primitive.get(i).width = width;
      }
    }
  }
  requestSceneRender();
}

function addColorPolygonPrimitive(key, instances, options = {}) {
  if (!instances.length) return null;
  const opaque = Boolean(options.opaque) && !options.surfaceOverlay;
  const primitive = state.viewer.scene.primitives.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: !opaque,
      closed: false,
      renderState: {
        depthTest: { enabled: true },
        depthMask: opaque,
        ...(!opaque ? { blending: Cesium.BlendingState.ALPHA_BLEND } : {}),
        ...(options.depthBias ? { polygonOffset: { enabled: true, factor: 2, units: 12 } } : {}),
        cull: { enabled: false }
      }
    }),
    asynchronous: options.asynchronous ?? true
  }));
  primitive.lifeKind = "colorPolygonPrimitive";
  rememberPrimitive(key, primitive);
  return primitive;
}

function addPolylineCollection(key, lines, options) {
  if (!lines.length) return null;
  const collection = state.viewer.scene.primitives.add(new Cesium.PolylineCollection());
  const color = Cesium.Color.fromCssColorString(options.color);
  const material = options.dash
    ? Cesium.Material.fromType("PolylineDash", {
      color,
      gapColor: Cesium.Color.TRANSPARENT,
      dashLength: 18
    })
    : Cesium.Material.fromType(Cesium.Material.ColorType, { color });
  for (const line of lines) {
    if (!line || line.length < 2) continue;
    collection.add({
      positions: positionsFromLineOffset(line, options.zOffset || 0),
      width: options.width,
      material
    });
  }
  collection.show = options.dynamicRoadDetail ? Cesium.Color.fromCssColorString(options.color).alpha > 0.002 : true;
  collection.lifeKind = "polylineCollection";
  collection.lifeBaseWidth = options.width;
  collection.lifeDynamicWidth = Boolean(options.dynamicWidth);
  collection.lifeDynamicRoadDetail = Boolean(options.dynamicRoadDetail);
  collection.lifeDynamicRoadMain = Boolean(options.dynamicRoadMain);
  collection.lifeMaterial = material;
  rememberPrimitive(key, collection);
  if (options.roundJoints) addRoundRoadPoints(key, lines, options);
  return collection;
}

function addRoundRoadPoints(key, lines, options) {
  const collection = state.viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
  const color = Cesium.Color.fromCssColorString(options.color);
  for (const line of lines || []) {
    if (!line || line.length < 2) continue;
    for (const point of line) {
      collection.add({
        position: pointCartesian(point, options.zOffset || 0),
        pixelSize: options.width * 1.04,
        color,
        disableDepthTestDistance: POINT_DEPTH_DISABLE_DISTANCE
      });
    }
  }
  collection.lifeKind = "roundPointCollection";
  collection.lifeBaseWidth = options.width;
  collection.lifeDynamicWidth = Boolean(options.dynamicWidth);
  collection.lifeDynamicRoadMain = Boolean(options.dynamicRoadMain);
  collection.lifeColorCss = options.color;
  rememberPrimitive(key, collection);
  return collection;
}

function updateTrees(force = false) {
  if (!state.viewer || !state.data) return;
  const trees = state.data.trees;
  if (state.activeCity?.files?.treesTileset) {
    if ((state.primitiveGroups.get("trees") || []).length) clearEntities("trees");
    const visible = !isMobileViewport() && state.visibleLayers.has("trees") && treeVisibilityProgress() > 0.03;
    setTreeTilesetVisible(visible);
    state.lastTreeStyle = { visible, signature: `tileset:${state.theme}` };
    return;
  }
  if (isMobileViewport() || !state.visibleLayers.has("trees") || !trees) {
    if ((state.primitiveGroups.get("trees") || []).length) clearEntities("trees");
    state.lastTreeStyle = null;
    return;
  }
  const progress = treeVisibilityProgress();
  const visible = progress > 0.03;
  const baseSignature = `${state.theme}:${isMobileViewport() ? "m" : "d"}:${treeStyleSignature(progress)}`;
  const primitives = state.primitiveGroups.get("trees") || [];
  if (!visible) {
    for (const primitive of primitives) primitive.show = false;
    state.lastTreeStyle = { visible: false, signature: baseSignature };
    return;
  }
  if (Array.isArray(trees.legacyItems)) {
    const signature = `${baseSignature}:legacy:${trees.legacyItems.length}`;
    if (force || !primitives.length || state.lastTreeStyle?.signature !== signature) renderTrees(signature, trees.legacyItems);
    return;
  }
  if (!trees.manifest) {
    ensureTreeManifest()
      .then(() => updateTrees(true))
      .catch((error) => console.error(error));
    return;
  }
  const view = treeViewState();
  const tileKeys = visibleTreeTileKeys(trees.manifest, view);
  const signature = `${baseSignature}:${view.signature}:${tileKeys.join(",")}`;
  if (!force && primitives.length && state.lastTreeStyle?.signature === signature) {
    if (!state.lastTreeStyle?.visible) {
      for (const primitive of primitives) primitive.show = true;
      state.lastTreeStyle = { visible: true, signature };
      requestSceneRender();
    }
    return;
  }
  if (!tileKeys.length) {
    if (primitives.length) clearEntities("trees");
    state.lastTreeStyle = null;
    return;
  }
  ensureTreeTiles(tileKeys);
  const items = loadedTreeItems(tileKeys, view);
  if (!items.length) {
    if (!trees.loadingTiles.size) {
      if (primitives.length) clearEntities("trees");
      state.lastTreeStyle = null;
    }
    return;
  }
  if (!force && primitives.length && state.lastTreeStyle?.signature !== signature) {
    scheduleTreeRefreshDelayed();
    return;
  }
  if (force || !primitives.length || state.lastTreeStyle?.signature !== signature) {
    renderTrees(signature, items);
    return;
  }
  if (!state.lastTreeStyle?.visible) {
    for (const primitive of primitives) primitive.show = true;
    requestSceneRender();
  }
  state.lastTreeStyle = { visible: true, signature };
}

async function setTreeTilesetVisible(visible) {
  const current = state.tilesets.get("trees");
  if (current) {
    if (current.show !== visible) {
      current.show = visible;
      requestSceneRender();
    }
    if (visible) applyTreeTheme();
    return;
  }
  const url = state.activeCity?.files?.treesTileset;
  if (!visible || !url || state.treeTilesetPromise) return;
  const city = state.activeCity;
  state.treeTilesetPromise = loadTileset(url, treeTilesetOptions())
    .then((tileset) => {
      if (state.activeCity !== city) {
        removeScenePrimitive(tileset);
        return null;
      }
      const shouldShow = !isMobileViewport() && state.visibleLayers.has("trees") && treeVisibilityProgress() > 0.03;
      tileset.lifeKind = "trees";
      tileset.show = shouldShow;
      state.tilesets.set("trees", tileset);
      if (shouldShow) applyTreeTheme();
      requestSceneRender();
      return tileset;
    })
    .catch((error) => console.error(error))
    .finally(() => {
      state.treeTilesetPromise = null;
    });
}

function treeTilesetOptions() {
  return {
    maximumScreenSpaceError: 18,
    dynamicScreenSpaceError: true,
    dynamicScreenSpaceErrorDensity: 0.0028,
    dynamicScreenSpaceErrorFactor: 2,
    skipLevelOfDetail: true,
    baseScreenSpaceError: 520,
    skipScreenSpaceErrorFactor: 8,
    skipLevels: 1,
    immediatelyLoadDesiredLevelOfDetail: false,
    loadSiblings: false,
    cacheBytes: 48 * 1024 * 1024,
    maximumCacheOverflowBytes: 24 * 1024 * 1024
  };
}

function treeVisibilityProgress() {
  const zoomMetric = cameraZoomMetric();
  return smoothStep(clamp((TREE_START_HEIGHT - zoomMetric) / (TREE_START_HEIGHT - TREE_FULL_HEIGHT), 0, 1));
}

function renderTrees(signature, sourceItems) {
  clearEntities("trees");
  const items = selectTreeItems(sourceItems || [], treeDisplayLimit());
  if (!items.length) return;
  const collection = state.viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
  const pixelSize = treePointSize();
  for (let index = 0; index < items.length; index += 1) {
    const tree = items[index];
    collection.add({
      position: pointCartesian(tree.point, TREE_GROUND_Z_OFFSET + 1.3),
      pixelSize,
      color: treeCrownColor(tree.kind),
      outlineColor: Cesium.Color.fromCssColorString(themeColor("treeTrunk")).withAlpha(0.34),
      outlineWidth: 0.45,
      scaleByDistance: new Cesium.NearFarScalar(250, 1.08, 8500, 0.42)
    });
  }
  collection.lifeKind = "treePointCollection";
  rememberPrimitive("trees", collection);
  state.lastTreeStyle = { visible: true, signature };
  raiseBuildingsToTop();
  requestSceneRender();
}

function selectTreeItems(items, max = TREE_MAX_DESKTOP) {
  if (items.length <= max) return items;
  const result = [];
  const step = items.length / max;
  for (let i = 0; i < max; i += 1) result.push(items[Math.floor(i * step)]);
  return result;
}

function treeDisplayLimit() {
  const progress = treeVisibilityProgress();
  return Math.round(650 + (TREE_MAX_DESKTOP - 650) * progress);
}

function treePointSize() {
  const progress = treeVisibilityProgress();
  return TREE_POINT_SIZE + (TREE_POINT_SIZE_NEAR - TREE_POINT_SIZE) * progress;
}

function treeStyleSignature(progress = treeVisibilityProgress()) {
  return `${Math.round(treeDisplayLimit() / 250)}:${Math.round((TREE_POINT_SIZE + (TREE_POINT_SIZE_NEAR - TREE_POINT_SIZE) * progress) * 2)}`;
}

function addTreePrimitive(key, instances) {
  if (!instances.length) return null;
  const primitive = state.viewer.scene.primitives.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: false,
      translucent: false,
      closed: true,
      renderState: {
        depthTest: { enabled: true },
        depthMask: true,
        cull: { enabled: true }
      }
    }),
    asynchronous: false
  }));
  primitive.lifeKind = "treePrimitive";
  rememberPrimitive(key, primitive);
  return primitive;
}

function treeModelMatrix(point, zOffset, scaleX, scaleY, scaleZ) {
  const position = pointCartesian(point, zOffset);
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(position);
  const scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(scaleX, scaleY, scaleZ));
  return Cesium.Matrix4.multiply(enu, scale, new Cesium.Matrix4());
}

function treeCrownColor(kind) {
  const colors = themeColor("treeCrown");
  const palette = Array.isArray(colors) ? colors : ["#506f42", "#5f814c", "#47693f"];
  return Cesium.Color.fromCssColorString(palette[Math.abs(Number(kind) || 0) % palette.length]);
}

function ensureTreeManifest() {
  const trees = state.data?.trees;
  if (!trees || !trees.manifestUrl || isMobileViewport()) return Promise.resolve(null);
  if (trees.manifest) return Promise.resolve(trees.manifest);
  if (trees.manifestPromise) return trees.manifestPromise;
  const treeState = trees;
  treeState.manifestPromise = fetchJson(treeState.manifestUrl)
    .then((manifest) => {
      if (state.data?.trees !== treeState) return null;
      treeState.manifest = manifest;
      treeState.tilesByKey = new Map((manifest.tiles || []).map((tile) => [tile.key, tile]));
      return manifest;
    })
    .finally(() => {
      if (state.data?.trees === treeState) treeState.manifestPromise = null;
    });
  return treeState.manifestPromise;
}

function visibleTreeTileKeys(manifest, view = treeViewState()) {
  const bbox = treeTileViewBbox(view);
  const tiles = manifest?.tiles || [];
  if (!bbox) return tiles.map((tile) => tile.key);
  return tiles.filter((tile) => bboxesIntersect(tile.bbox, bbox)).map((tile) => tile.key);
}

function ensureTreeTiles(tileKeys) {
  const trees = state.data?.trees;
  if (!trees) return;
  for (const key of tileKeys) {
    if (trees.loadedTiles.has(key) || trees.loadingTiles.has(key)) continue;
    const tile = trees.tilesByKey.get(key);
    if (!tile) continue;
    trees.loadingTiles.add(key);
    const treeState = trees;
    fetchJson(tile.url)
      .then((payload) => {
        if (state.data?.trees !== treeState) return;
        treeState.loadedTiles.set(key, payload.items || []);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (state.data?.trees !== treeState) return;
        treeState.loadingTiles.delete(key);
        scheduleTreeRefresh();
      });
  }
}

function scheduleTreeRefresh() {
  if (state.treeRefreshScheduled) return;
  state.treeRefreshScheduled = true;
  requestAnimationFrame(() => {
    state.treeRefreshScheduled = false;
    updateTrees(true);
    requestSceneRender();
  });
}

function scheduleTreeRefreshDelayed() {
  window.clearTimeout(state.treeRefreshTimer);
  state.treeRefreshTimer = window.setTimeout(() => {
    state.treeRefreshTimer = null;
    updateTrees(true);
  }, TREE_REFRESH_DELAY_MS);
}

function loadedTreeItems(tileKeys, view = treeViewState()) {
  const trees = state.data?.trees;
  if (!trees) return [];
  const items = [];
  for (const key of tileKeys) {
    const tileItems = trees.loadedTiles.get(key);
    if (tileItems?.length) items.push(...tileItems);
  }
  if (!view.center || !Number.isFinite(view.radius)) return items;
  return items.filter((item) => segmentDistanceMeters(item.point, view.center) <= view.radius);
}

function treeViewState() {
  if (!state.viewer || !state.activeCity) {
    return { center: null, radius: TREE_RENDER_RADIUS_MAX, signature: "none" };
  }
  const canvas = state.viewer.scene.canvas;
  const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
  const target = pickCameraControlPlane(center)
    || Cesium.Cartesian3.fromDegrees(state.activeCity.center[0], state.activeCity.center[1], cityGroundHeight());
  const carto = Cesium.Cartographic.fromCartesian(target);
  const lon = Cesium.Math.toDegrees(carto.longitude);
  const lat = Cesium.Math.toDegrees(carto.latitude);
  const radius = treeRenderRadiusMeters();
  const centerPoint = [lon, lat, 0];
  const metersPerLon = 111320 * Math.max(0.2, Math.cos(carto.latitude));
  const lonBucket = Math.round((lon * metersPerLon) / TREE_VIEW_SIGNATURE_STEP_M);
  const latBucket = Math.round((lat * 111320) / TREE_VIEW_SIGNATURE_STEP_M);
  const radiusBucket = Math.round(radius / TREE_RADIUS_SIGNATURE_STEP_M);
  return {
    center: centerPoint,
    radius,
    lon,
    lat,
    signature: `${lonBucket}:${latBucket}:${radiusBucket}`
  };
}

function treeRenderRadiusMeters() {
  if (!state.viewer) return TREE_RENDER_RADIUS_MAX;
  const zoomMetric = cameraZoomMetric();
  const pitchDeg = Cesium.Math.toDegrees(state.viewer.camera.pitch);
  const tilt = smoothStep(clamp((pitchDeg + 84) / 48, 0, 1));
  const zoomRadius = clamp(zoomMetric * 0.88, TREE_RENDER_RADIUS_MIN, TREE_RENDER_RADIUS_MAX);
  const tiltedLimit = TREE_RENDER_RADIUS_MIN + (TREE_RENDER_RADIUS_MAX - TREE_RENDER_RADIUS_MIN) * (1 - tilt);
  return clamp(Math.min(zoomRadius, tiltedLimit), TREE_RENDER_RADIUS_MIN, TREE_RENDER_RADIUS_MAX);
}

function treeTileViewBbox(view = treeViewState()) {
  if (!view.center) return null;
  const radius = view.radius * TREE_TILE_LOAD_BUFFER;
  const latRad = view.lat * Math.PI / 180;
  const latDelta = radius / 111320;
  const lonDelta = radius / (111320 * Math.max(0.2, Math.cos(latRad)));
  return [view.lon - lonDelta, view.lat - latDelta, view.lon + lonDelta, view.lat + latDelta];
}

function bboxesIntersect(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

function splitLinesIntoDashes(lines, dashLength, gapLength) {
  const result = [];
  for (const line of lines || []) result.push(...splitLineIntoDashes(line, dashLength, gapLength));
  return result;
}

function splitLineIntoDashes(line, dashLength, gapLength) {
  if (!line || line.length < 2) return [];
  const pieces = [];
  let drawing = true;
  let remainingPattern = dashLength;
  for (let i = 1; i < line.length; i += 1) {
    let start = line[i - 1];
    const end = line[i];
    let remainingSegment = segmentDistanceMeters(start, end);
    if (!Number.isFinite(remainingSegment) || remainingSegment <= 0) continue;
    while (remainingSegment > 0.01) {
      const take = Math.min(remainingSegment, remainingPattern);
      const t = take / remainingSegment;
      const next = interpolateGeoPoint(start, end, t);
      if (drawing) pieces.push([start, next]);
      start = next;
      remainingSegment -= take;
      remainingPattern -= take;
      if (remainingPattern <= 0.01) {
        drawing = !drawing;
        remainingPattern = drawing ? dashLength : gapLength;
      }
    }
  }
  return pieces;
}

function segmentDistanceMeters(a, b) {
  const lat = (((a?.[1] || 0) + (b?.[1] || 0)) / 2) * Math.PI / 180;
  const dx = ((b?.[0] || 0) - (a?.[0] || 0)) * 111320 * Math.cos(lat);
  const dy = ((b?.[1] || 0) - (a?.[1] || 0)) * 111320;
  const dz = ((b?.[2] || 0) - (a?.[2] || 0));
  return Math.hypot(dx, dy, dz);
}

function interpolateGeoPoint(a, b, t) {
  return [
    (a?.[0] || 0) + ((b?.[0] || 0) - (a?.[0] || 0)) * t,
    (a?.[1] || 0) + ((b?.[1] || 0) - (a?.[1] || 0)) * t,
    (a?.[2] || 0) + ((b?.[2] || 0) - (a?.[2] || 0)) * t
  ];
}

function renderSelectedQuarter() {
  clearEntities("selectedQuarter");
  stopSelectedPulse();
  const feature = state.selectedFeature;
  if (!state.viewer || !feature || !state.visibleLayers.has("quartals")) {
    requestSceneRender();
    return;
  }
  for (const polygon of feature.polygons || []) {
    const hierarchy = new Cesium.CallbackProperty(() => hierarchyFromPolygonOffset(polygon, selectedZOffset()), false);
    const fill = state.viewer.entities.add({
      polygon: {
        hierarchy,
        material: Cesium.Color.fromCssColorString(themeColor("selectedFill")),
        perPositionHeight: true
      }
    });
    rememberEntity("selectedQuarter", fill);
    for (const ring of polygonRings(polygon)) {
      const positions = new Cesium.CallbackProperty(() => positionsFromLineOffset(ring, selectedZOffset()), false);
      const outer = state.viewer.entities.add({
        polyline: {
          positions,
          width: 6,
          material: Cesium.Color.fromCssColorString(themeColor("selectedOuter"))
        }
      });
      const inner = state.viewer.entities.add({
        polyline: {
          positions,
          width: 2.4,
          material: Cesium.Color.fromCssColorString(themeColor("selectedInner"))
        }
      });
      rememberEntity("selectedQuarter", outer);
      rememberEntity("selectedQuarter", inner);
    }
  }
  startSelectedPulse();
  requestSceneRender();
}

function selectedZOffset() {
  const phase = performance.now() / SELECTED_PULSE_MS;
  return SELECTED_Z_BASE + (Math.sin(phase) + 1) * SELECTED_Z_AMPLITUDE;
}

function startSelectedPulse() {
  stopSelectedPulse();
  state.selectedPulseTimer = window.setInterval(requestSceneRender, 48);
}

function stopSelectedPulse() {
  if (!state.selectedPulseTimer) return;
  window.clearInterval(state.selectedPulseTimer);
  state.selectedPulseTimer = null;
}

function requestSceneRender() {
  state.viewer?.scene?.requestRender?.();
}

function cityGroundHeight() {
  const value = Number(state.data?.center?.[2] ?? state.activeCity?.center?.[2] ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function cameraZoomMetric() {
  if (!state.viewer) return 9000;
  const canvas = state.viewer.scene.canvas;
  const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
  const target = pickCameraControlPlane(center);
  if (target) {
    const rawRange = Cesium.Cartesian3.distance(state.viewer.camera.positionWC, target);
    const stableRange = stableCameraOrbitRange(rawRange);
    if (Number.isFinite(stableRange) && stableRange > 0) {
      return stableRange * CAMERA_ZOOM_METRIC_PITCH_FACTOR;
    }
  }
  const camera = state.viewer.camera;
  const pitchFactor = Math.max(0.45, Math.abs(Math.sin(camera.pitch)));
  return camera.positionCartographic.height / pitchFactor;
}

function roadWidthFactor(zoomMetric) {
  const t = clamp((7000 - zoomMetric) / 4400, 0, 1);
  const eased = t * t * (3 - 2 * t);
  return 0.18 + eased * 0.82;
}

function roadMainColor(widthFactor) {
  const near = cssRgb(themeColor("roadMain")) || [126, 136, 132];
  const far = cssRgb(themeColor("roadMainFar")) || near;
  const t = smoothStep(clamp((widthFactor - 0.18) / 0.82, 0, 1));
  const mixed = far.map((value, index) => Math.round(value + (near[index] - value) * t));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function cssRgb(value) {
  const match = String(value || "").match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function roadDetailProgress(zoomMetric = cameraZoomMetric()) {
  return smoothStep(clamp((ROAD_DETAIL_START_HEIGHT - zoomMetric) / (ROAD_DETAIL_START_HEIGHT - ROAD_DETAIL_FULL_HEIGHT), 0, 1));
}

function roadDetailAlpha(progress) {
  return (0.04 + 0.18 * progress) * progress;
}

function detailRoadWidth(progress) {
  const eased = progress * progress * (3 - 2 * progress);
  return 0.42 + eased * 0.34;
}

function roadDetailColor(alpha) {
  const palette = mapThemePalette();
  return typeof palette.roadDetail === "function" ? palette.roadDetail(alpha) : `rgba(91, 96, 96, ${alpha})`;
}

function renderRoadLabels() {
  clearEntities("roadLabels");
  resizeRoadLabelCanvas();
  drawRoadLabels();
  requestSceneRender();
}

function resizeRoadLabelCanvas() {
  const canvas = els.roadLabelCanvas;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx, width: rect.width, height: rect.height };
}

function clearRoadLabelCanvas() {
  const setup = resizeRoadLabelCanvas();
  if (!setup) return;
  setup.ctx.clearRect(0, 0, setup.width, setup.height);
}

function drawRoadLabels() {
  const setup = resizeRoadLabelCanvas();
  if (!setup || !state.viewer || !state.data?.roadLabels?.labels?.length) {
    clearRoadLabelCanvas();
    return;
  }
  const rawAlpha = roadLabelAlpha();
  setup.canvas.dataset.alpha = rawAlpha.toFixed(3);
  setup.canvas.dataset.candidates = "0";
  setup.canvas.dataset.drawn = "0";
  const ctx = setup.ctx;
  ctx.clearRect(0, 0, setup.width, setup.height);
  if (rawAlpha < ROAD_LABEL_DRAW_ALPHA_MIN) return;
  const alpha = smoothStep((rawAlpha - ROAD_LABEL_DRAW_ALPHA_MIN) / (ROAD_LABEL_FULL_ALPHA_AT - ROAD_LABEL_DRAW_ALPHA_MIN));
  if (alpha <= 0.03) return;

  const fontSize = roadLabelFontSize();
  const letterSpacing = matchMedia("(max-width: 760px)").matches ? 0.15 : 0.25;
  const maxLabels = matchMedia("(max-width: 760px)").matches ? 24 : Math.round(42 + 36 * alpha);
  const centerX = setup.width / 2;
  const centerY = setup.height / 2;
  const placed = [];
  let drawn = 0;

  ctx.save();
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";

  const candidates = state.data.roadLabels.labels
    .map((label) => {
      const point = projectRoadLabelPoint(label.point);
      if (!point) return null;
      const path = readableRoadLabelPath(label);
      if (!path) return null;
      const metrics = screenPathMetrics(path);
      if (metrics.total < fontSize * Math.max(5, Array.from(label.text || "").length * 0.58)) return null;
      return { label, path, metrics, sx: point.x, sy: point.y, distance: Math.hypot(point.x - centerX, point.y - centerY) };
    })
    .filter(Boolean)
    .filter(({ sx, sy }) => sx > -120 && sx < setup.width + 120 && sy > -90 && sy < setup.height + 90)
    .sort((a, b) => (b.label.priority || 0) - (a.label.priority || 0) || (b.label.length || 0) - (a.label.length || 0) || a.distance - b.distance);
  setup.canvas.dataset.candidates = String(candidates.length);

  for (const item of candidates) {
    if (drawn >= maxLabels) break;
    const glyphs = measureRoadLabelGlyphs(ctx, item.label.text || "", letterSpacing);
    if (glyphs.total > item.metrics.total * 0.82) continue;
    const placement = roadLabelPlacement(item.path, item.metrics, glyphs, fontSize);
    if (!placement || roadLabelCurveRange(placement) > 1.75) continue;
    const bounds = curvedLabelBounds(placement, fontSize);
    if (!boxesOverlap(bounds, [0, 0, setup.width, setup.height], 4)) continue;
    if (placed.some((box) => boxesOverlap(box, bounds, 5))) continue;
    placed.push(bounds);
    drawCurvedRoadLabel(ctx, placement, alpha);
    drawn += 1;
  }
  setup.canvas.dataset.drawn = String(drawn);
  ctx.restore();
}

function roadLabelAlpha() {
  const camera = state.viewer.camera;
  const zoomMetric = cameraZoomMetric();
  const zoomAlpha = smoothStep(clamp((ROAD_LABEL_START_HEIGHT - zoomMetric) / (ROAD_LABEL_START_HEIGHT - ROAD_LABEL_FULL_HEIGHT), 0, 1));
  const pitchDeg = Cesium.Math.toDegrees(camera.pitch);
  const pitchAlpha = smoothStep(clamp((pitchDeg - ROAD_LABEL_PITCH_FADE_START) / (ROAD_LABEL_PITCH_FADE_END - ROAD_LABEL_PITCH_FADE_START), 0, 1));
  return zoomAlpha * pitchAlpha;
}

function roadLabelFontSize() {
  const zoomMetric = cameraZoomMetric();
  const t = smoothStep(clamp((ROAD_LABEL_FULL_HEIGHT - zoomMetric) / 2600, 0, 1));
  return 12.7 + (10.9 - 12.7) * t;
}

function readableRoadLabelPath(label) {
  const source = label.line?.length > 1 ? label.line : roadLabelFallbackLine(label);
  if (!source || source.length < 2) return null;
  let path = source.map(projectRoadLabelPoint).filter(Boolean).map((point) => [point.x, point.y]);
  if (path.length < 2) return null;
  const metrics = screenPathMetrics(path);
  const middle = pointOnScreenPath(path, metrics, metrics.total / 2);
  if (middle && (middle.angle > Math.PI / 2 || middle.angle < -Math.PI / 2)) path = [...path].reverse();
  return path;
}

function roadLabelFallbackLine(label) {
  const point = label.point;
  if (!point) return null;
  const distance = 0.0008;
  const angle = label.angle || 0;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  return [
    [point[0] - dx, point[1] - dy, point[2] || 0],
    [point[0] + dx, point[1] + dy, point[2] || 0]
  ];
}

function projectRoadLabelPoint(point) {
  if (!point) return null;
  const screen = worldToScreen(pointCartesian(point, -ROAD_LABEL_DATA_Z_OFFSET + 0.95));
  return screen ? { x: screen.x, y: screen.y } : null;
}

function screenPathMetrics(path) {
  const distances = [0];
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    distances.push(total);
  }
  return { distances, total };
}

function pointOnScreenPath(path, metrics, distance) {
  const target = clamp(distance, 0, metrics.total);
  for (let i = 1; i < path.length; i += 1) {
    if (metrics.distances[i] < target) continue;
    const a = path[i - 1];
    const b = path[i];
    const start = metrics.distances[i - 1];
    const length = metrics.distances[i] - start || 1;
    const t = clamp((target - start) / length, 0, 1);
    return {
      x: a[0] + (b[0] - a[0]) * t,
      y: a[1] + (b[1] - a[1]) * t,
      angle: Math.atan2(b[1] - a[1], b[0] - a[0])
    };
  }
  const a = path[path.length - 2];
  const b = path[path.length - 1];
  return b && a ? { x: b[0], y: b[1], angle: Math.atan2(b[1] - a[1], b[0] - a[0]) } : null;
}

function measureRoadLabelGlyphs(ctx, text, letterSpacing) {
  const chars = Array.from(text);
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, chars.length - 1) * letterSpacing;
  return { chars, widths, letterSpacing, total };
}

function roadLabelVisibleDistance(path, metrics, width, height) {
  const pad = 72;
  const centerX = width / 2;
  const centerY = height / 2;
  const step = Math.max(22, metrics.total / 90);
  let best = null;
  for (let distance = 0; distance <= metrics.total; distance += step) {
    const point = pointOnScreenPath(path, metrics, distance);
    if (!point) continue;
    if (point.x < -pad || point.x > width + pad || point.y < -pad || point.y > height + pad) continue;
    const score = Math.hypot(point.x - centerX, point.y - centerY);
    if (!best || score < best.score) best = { distance, score };
  }
  return best ? best.distance : null;
}

function roadLabelPlacement(path, metrics, glyphs, fontSize, centerDistance = metrics.total / 2) {
  const margin = fontSize * 0.8 + glyphs.total / 2;
  const center = clamp(centerDistance, margin, Math.max(margin, metrics.total - margin));
  const start = center - glyphs.total / 2;
  if (start < fontSize * 0.8 || start + glyphs.total > metrics.total - fontSize * 0.8) return null;
  const placement = [];
  let cursor = start;
  for (let i = 0; i < glyphs.chars.length; i += 1) {
    const width = glyphs.widths[i];
    const point = pointOnScreenPath(path, metrics, cursor + width / 2);
    if (!point) return null;
    placement.push({ char: glyphs.chars[i], x: point.x, y: point.y, angle: point.angle, width });
    cursor += width + glyphs.letterSpacing;
  }
  return placement;
}

function roadLabelCurveRange(placement) {
  if (placement.length < 2) return 0;
  let previous = placement[0].angle;
  let range = 0;
  for (const item of placement.slice(1)) {
    let delta = item.angle - previous;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    range += Math.abs(delta);
    previous = item.angle;
  }
  return range;
}

function curvedLabelBounds(placement, fontSize) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const item of placement) {
    minX = Math.min(minX, item.x);
    minY = Math.min(minY, item.y);
    maxX = Math.max(maxX, item.x);
    maxY = Math.max(maxY, item.y);
  }
  const padding = fontSize * 1.35;
  return [minX - padding, minY - padding, maxX + padding, maxY + padding];
}

function pathBounds(path) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of path) {
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }
  return [minX, minY, maxX, maxY];
}

function drawCurvedRoadLabel(ctx, placement, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.lineWidth = 4.2;
  ctx.strokeStyle = themeColor("roadLabelHalo");
  ctx.fillStyle = themeColor("roadLabel");
  for (const item of placement) {
    if (item.char === " ") continue;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.angle);
    ctx.strokeText(item.char, 0, 0);
    ctx.fillText(item.char, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function boxesOverlap(a, b, padding = 0) {
  return a[0] - padding <= b[2]
    && a[2] + padding >= b[0]
    && a[1] - padding <= b[3]
    && a[3] + padding >= b[1];
}

function renderPoints(key, items, styleFn) {
  clearEntities(key);
  for (const item of items || []) {
    const style = styleFn(item);
    const marker = style.shape === "square"
      ? {
          billboard: {
            image: pointSquareMarkerImage(
              style.color,
              Object.prototype.hasOwnProperty.call(style, "strokeColor") ? style.strokeColor : themeColor("pointStroke"),
              style.size
            ),
            width: style.displaySize || style.size,
            height: style.displaySize || style.size,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            disableDepthTestDistance: POINT_DEPTH_DISABLE_DISTANCE
          }
        }
      : {
          point: {
            pixelSize: style.size,
            color: Cesium.Color.fromCssColorString(style.color),
            outlineColor: Cesium.Color.fromCssColorString(themeColor("pointStroke")),
            outlineWidth: 1,
            disableDepthTestDistance: POINT_DEPTH_DISABLE_DISTANCE
          }
        };
    const entity = state.viewer.entities.add({
      position: pointLayerCartesian(item.point, key),
      ...marker
    });
    entity.lifePoint = item;
    rememberEntity(key, entity);
  }
  requestSceneRender();
}

async function renderAccidentsClustered() {
  clearEntities("dtp");
  const items = state.data?.dtp?.items || [];
  if (!items.length) return;
  state.primitiveGroups.set("dtp", []);
  scheduleAccidentClusterUpdate(true);
  requestSceneRender();
}

function scheduleAccidentClusterUpdate(force = false) {
  if (!state.viewer || !state.visibleLayers.has("dtp") || !state.data?.dtp?.items?.length) return;
  state.accidentClusterRenderForce = state.accidentClusterRenderForce || force;
  if (state.accidentClusterRenderFrame) return;
  state.accidentClusterRenderFrame = requestAnimationFrame(() => {
    const shouldForce = state.accidentClusterRenderForce;
    state.accidentClusterRenderFrame = null;
    state.accidentClusterRenderForce = false;
    updateAccidentClusterEntities(shouldForce);
  });
}

function updateAccidentClusterEntities(force = false) {
  if (!state.viewer || !state.visibleLayers.has("dtp") || !state.data?.dtp?.items?.length) return;
  const now = performance.now();
  if (!force && now - state.lastAccidentClusterUpdateAt < ACCIDENT_CLUSTER_UPDATE_INTERVAL_MS) return;
  const viewSignature = accidentViewSignature();
  if (!force && viewSignature === state.lastAccidentViewSignature) return;
  state.lastAccidentClusterUpdateAt = now;
  let targets = null;
  if (force && viewSignature === state.lastAccidentViewSignature && state.accidentClusterTargets) {
    targets = state.accidentClusterTargets;
  } else {
    targets = buildAccidentDisplayItems();
    state.lastAccidentViewSignature = viewSignature;
    state.accidentClusterTargets = targets;
  }
  const signature = accidentClusterSignature(targets);
  if (!force && signature === state.lastAccidentClusterSignature) return;
  state.lastAccidentClusterSignature = signature;
  const displayItems = smoothAccidentDisplayItems(targets);
  drawAccidentCanvas(displayItems);
  requestSceneRender();
}

function resizeAccidentCanvas() {
  const canvas = els.accidentCanvas;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx, width: rect.width, height: rect.height };
}

function clearAccidentCanvas() {
  const setup = resizeAccidentCanvas();
  if (setup) setup.ctx.clearRect(0, 0, setup.width, setup.height);
  state.accidentDisplayItems = [];
  state.accidentScreenItems = [];
}

function drawAccidentCanvas(items) {
  const setup = resizeAccidentCanvas();
  if (!setup || !state.viewer) return;
  const { ctx, width, height } = setup;
  ctx.clearRect(0, 0, width, height);
  state.accidentDisplayItems = items || [];
  const screenItems = [];
  for (const item of state.accidentDisplayItems) {
    const screen = worldToScreen(pointLayerCartesian(item.point, "dtp"));
    if (!screen || screen.x < -80 || screen.y < -80 || screen.x > width + 80 || screen.y > height + 80) continue;
    const isCluster = Boolean(item.items);
    const style = accidentStyle(item);
    const size = item.displaySize ?? style.size;
    const radius = Math.max(3, size / 2);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isCluster ? themeColor("accidentCluster") : style.color;
    ctx.fill();
    ctx.lineWidth = isCluster ? 1.4 : 1;
    ctx.strokeStyle = themeColor("pointStroke");
    ctx.stroke();
    if (isCluster) {
      const text = String(item.items.length);
      const fontSize = clamp(size * (text.length > 2 ? 0.34 : text.length > 1 ? 0.39 : 0.46), 8, 13.5);
      ctx.font = `700 ${fontSize}px Inter, Segoe UI, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(36, 24, 20, 0.45)";
      ctx.fillStyle = themeColor("accidentText");
      ctx.strokeText(text, screen.x, screen.y + 0.4);
      ctx.fillText(text, screen.x, screen.y + 0.4);
    }
    screenItems.push({
      item,
      x: screen.x,
      y: screen.y,
      radius: Math.max(radius + 4, 8),
      isCluster
    });
  }
  state.accidentScreenItems = screenItems;
}

function pickAccidentOverlay(position) {
  if (!state.visibleLayers.has("dtp") || !state.accidentScreenItems.length) return null;
  for (let index = state.accidentScreenItems.length - 1; index >= 0; index -= 1) {
    const hit = state.accidentScreenItems[index];
    if (Math.hypot(hit.x - position.x, hit.y - position.y) > hit.radius) continue;
    if (hit.isCluster) {
      return {
        id: {
          lifeCluster: hit.item.items,
          lifeClusterPoint: hit.item.point
        }
      };
    }
    return {
      id: {
        lifePoint: hit.item.sourceItem || hit.item
      }
    };
  }
  return null;
}

function accidentClusterSignature(items) {
  return items
    .map((item) => `${item.key}:${Math.round(item.point[0] * 10000000 / ACCIDENT_CLUSTER_SIGNATURE_EPS)}:${Math.round(item.point[1] * 10000000 / ACCIDENT_CLUSTER_SIGNATURE_EPS)}`)
    .sort()
    .join("|");
}

function buildAccidentDisplayItems() {
  const clusterDistance = accidentClusterDistance();
  const clusterCells = new Map();
  const clusters = [];
  for (const item of state.data?.dtp?.items || []) {
    const screen = worldToScreen(pointLayerCartesian(item.point, "dtp"));
    if (!screen) continue;
    const gridX = Math.floor(screen.x / clusterDistance);
    const gridY = Math.floor(screen.y / clusterDistance);
    let cluster = null;
    for (let dx = -1; dx <= 1 && !cluster; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const candidates = clusterCells.get(`${gridX + dx}:${gridY + dy}`);
        if (!candidates) continue;
        for (const candidate of candidates) {
          if (Math.hypot(candidate.sx - screen.x, candidate.sy - screen.y) <= clusterDistance) {
            cluster = candidate;
            break;
          }
        }
        if (cluster) break;
      }
    }
    if (!cluster) {
      cluster = {
        sx: screen.x,
        sy: screen.y,
        point: [...item.point],
        lonSum: Number(item.point?.[0] || 0),
        latSum: Number(item.point?.[1] || 0),
        heightSum: Number(item.point?.[2] || 0),
        items: [item]
      };
      clusters.push(cluster);
      const cellKey = `${gridX}:${gridY}`;
      if (!clusterCells.has(cellKey)) clusterCells.set(cellKey, []);
      clusterCells.get(cellKey).push(cluster);
      continue;
    }
    const count = cluster.items.length + 1;
    cluster.sx = (cluster.sx * cluster.items.length + screen.x) / count;
    cluster.sy = (cluster.sy * cluster.items.length + screen.y) / count;
    cluster.lonSum += Number(item.point?.[0] || 0);
    cluster.latSum += Number(item.point?.[1] || 0);
    cluster.heightSum += Number(item.point?.[2] || 0);
    cluster.point = [cluster.lonSum / count, cluster.latSum / count, cluster.heightSum / count];
    cluster.items.push(item);
  }
  return clusters.map((cluster) => {
    if (cluster.items.length === 1) {
      const sourceItem = cluster.items[0];
      const key = accidentItemKey(sourceItem);
      return { ...sourceItem, sourceItem, key, memberKeys: [key], point: [...sourceItem.point] };
    }
    const injured = cluster.items.reduce((sum, item) => sum + (Number(item.properties?.injured) || 0), 0);
    const dead = cluster.items.reduce((sum, item) => sum + (Number(item.properties?.dead) || 0), 0);
    const memberKeys = cluster.items.map(accidentItemKey).sort();
    return {
      key: accidentClusterKey(memberKeys),
      memberKeys,
      items: cluster.items,
      point: cluster.point,
      properties: {
        type: "cluster",
        injured,
        dead,
        severity: injured + dead * 3
      }
    };
  });
}

function smoothAccidentDisplayItems(targets) {
  if (!targets.length) {
    resetAccidentAnimation();
    return [];
  }
  const previous = state.accidentAnimatedItems || new Map();
  const next = new Map();
  let needsFrame = false;
  for (const target of targets) {
    const previousItem = previous.get(target.key) || previousAccidentByMembers(target, previous) || nearestPreviousAccident(target, previous);
    const targetSize = accidentPixelSize(target);
    const startPoint = previousItem?.point || target.point;
    const startSize = previousItem?.displaySize ?? (previousItem ? accidentPixelSize(previousItem) : targetSize);
    const point = [
      startPoint[0] + (target.point[0] - startPoint[0]) * ACCIDENT_CLUSTER_SMOOTHING,
      startPoint[1] + (target.point[1] - startPoint[1]) * ACCIDENT_CLUSTER_SMOOTHING,
      (startPoint[2] || 0) + ((target.point[2] || 0) - (startPoint[2] || 0)) * ACCIDENT_CLUSTER_SMOOTHING
    ];
    const displaySize = startSize + (targetSize - startSize) * ACCIDENT_CLUSTER_SMOOTHING;
    const item = { ...target, point, targetPoint: target.point, displaySize };
    next.set(target.key, item);
    if (geoPointDistanceMeters(point, target.point) > 0.2 || Math.abs(displaySize - targetSize) > 0.15) needsFrame = true;
  }
  state.accidentAnimatedItems = next;
  if (needsFrame) requestAccidentAnimationFrame();
  return [...next.values()];
}

function previousAccidentByMembers(target, previous) {
  if (!target.memberKeys?.length || !previous.size) return null;
  const targetMembers = new Set(target.memberKeys);
  const matches = [];
  for (const item of previous.values()) {
    const members = item.memberKeys || [item.key].filter(Boolean);
    if (members.some((key) => targetMembers.has(key))) matches.push(item);
  }
  if (!matches.length) return null;
  return {
    point: averageGeoPoints(matches),
    displaySize: matches.reduce((sum, item) => sum + (item.displaySize ?? accidentPixelSize(item)), 0) / matches.length,
    memberKeys: target.memberKeys
  };
}

function nearestPreviousAccident(target, previous) {
  let best = null;
  let bestDistance = Infinity;
  for (const item of previous.values()) {
    const distance = geoPointDistanceMeters(target.point, item.point);
    if (distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  }
  return bestDistance < 180 ? best : null;
}

function requestAccidentAnimationFrame() {
  if (state.accidentAnimationFrame) return;
  state.accidentAnimationFrame = requestAnimationFrame(() => {
    state.accidentAnimationFrame = null;
    scheduleAccidentClusterUpdate(true);
  });
}

function resetAccidentAnimation() {
  if (state.accidentAnimationFrame) cancelAnimationFrame(state.accidentAnimationFrame);
  if (state.accidentClusterRenderFrame) cancelAnimationFrame(state.accidentClusterRenderFrame);
  state.accidentAnimationFrame = null;
  state.accidentClusterRenderFrame = null;
  state.accidentClusterRenderForce = false;
  state.accidentAnimatedItems = new Map();
  state.lastAccidentClusterSignature = null;
  state.lastAccidentViewSignature = null;
  state.lastAccidentClusterUpdateAt = 0;
  state.accidentClusterTargets = null;
}

function accidentClusterDistance() {
  const height = state.viewer?.camera?.positionCartographic?.height || 6000;
  const t = smoothStep(clamp((4800 - height) / 3300, 0, 1));
  return 46 - t * 30;
}

function accidentViewSignature() {
  const camera = state.viewer?.camera;
  const cartographic = camera?.positionCartographic;
  if (!camera || !cartographic) return "no-camera";
  const lon = Number.isFinite(cartographic.longitude) ? Cesium.Math.toDegrees(cartographic.longitude) : 0;
  const lat = Number.isFinite(cartographic.latitude) ? Cesium.Math.toDegrees(cartographic.latitude) : 0;
  const metersPerLon = 111320 * Math.max(0.2, Math.cos(cartographic.latitude || 0));
  const lonBucket = Math.round((lon * metersPerLon) / 28);
  const latBucket = Math.round((lat * 111320) / 28);
  const heightBucket = Math.round((cartographic.height || 0) / 35);
  const headingBucket = Math.round(Cesium.Math.toDegrees(camera.heading || 0) / 0.75);
  const pitchBucket = Math.round(Cesium.Math.toDegrees(camera.pitch || 0) / 0.75);
  return `${lonBucket}:${latBucket}:${heightBucket}:${headingBucket}:${pitchBucket}`;
}

function accidentItemKey(item) {
  const props = item.properties || {};
  const id = props.id ?? props.osm_id ?? props.full_id ?? props.uid;
  if (id !== null && id !== undefined && id !== "") return `a:${id}`;
  return `a:${Number(item.point?.[0] || 0).toFixed(7)}:${Number(item.point?.[1] || 0).toFixed(7)}:${props.date || ""}:${props.time || ""}`;
}

function accidentClusterKey(memberKeys) {
  let hash = 0;
  for (const key of memberKeys) {
    for (let i = 0; i < key.length; i += 1) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return `c:${memberKeys.length}:${Math.abs(hash)}`;
}

function averageGeoPoints(items) {
  if (!items.length) return [state.activeCity.center[0], state.activeCity.center[1], 0];
  const sum = items.reduce((acc, item) => {
    const point = item.point || item.targetPoint || [0, 0, 0];
    acc[0] += Number(point[0] || 0);
    acc[1] += Number(point[1] || 0);
    acc[2] += Number(point[2] || 0);
    return acc;
  }, [0, 0, 0]);
  return [sum[0] / items.length, sum[1] / items.length, sum[2] / items.length];
}

function geoPointDistanceMeters(a, b) {
  return segmentDistanceMeters(a || [0, 0, 0], b || [0, 0, 0]);
}

function averagePoint(items) {
  if (!items.length) return [state.activeCity.center[0], state.activeCity.center[1], 0];
  const sum = items.reduce((acc, item) => {
    acc[0] += Number(item.point?.[0] || 0);
    acc[1] += Number(item.point?.[1] || 0);
    acc[2] += Number(item.point?.[2] || 0);
    return acc;
  }, [0, 0, 0]);
  return [sum[0] / items.length, sum[1] / items.length, sum[2] / items.length];
}

function pointCartesian(point, zOffset = 0) {
  return Cesium.Cartesian3.fromDegrees(point?.[0] || 0, point?.[1] || 0, (point?.[2] || 0) + zOffset);
}

function pointLayerCartesian(point, key) {
  const embeddedOffset = POINT_DATA_Z_OFFSETS[key] || 0;
  return pointCartesian(point, -embeddedOffset + POINT_GROUND_Z_OFFSET);
}

function pointSquareMarkerImage(fill, stroke, size) {
  const key = `${fill}|${stroke}|${size}`;
  pointSquareMarkerImage.cache ||= new Map();
  if (pointSquareMarkerImage.cache.has(key)) return pointSquareMarkerImage.cache.get(key);
  const pixelRatio = Math.max(2, Math.ceil(window.devicePixelRatio || 1));
  const canvas = document.createElement("canvas");
  const sideCss = Math.ceil(size + 3);
  const side = sideCss * pixelRatio;
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  ctx.scale(pixelRatio, pixelRatio);
  const markerSize = size;
  const offset = Math.floor((sideCss - markerSize) / 2);
  if (stroke) {
    ctx.fillStyle = stroke;
    ctx.fillRect(offset, offset, markerSize, markerSize);
    ctx.fillStyle = fill;
    ctx.fillRect(offset + 1, offset + 1, markerSize - 2, markerSize - 2);
  } else {
    ctx.fillStyle = fill;
    ctx.fillRect(offset, offset, markerSize, markerSize);
  }
  const image = canvas.toDataURL("image/png");
  pointSquareMarkerImage.cache.set(key, image);
  return image;
}

function worldToScreen(cartesian) {
  const transforms = Cesium.SceneTransforms;
  const fn = transforms.worldToWindowCoordinates || transforms.wgs84ToWindowCoordinates;
  return typeof fn === "function" ? fn(state.viewer.scene, cartesian) : null;
}

function stopStyle(item) {
  const source = String(item.properties?.source || "");
  const isTram = source.includes("tram");
  return {
    size: isTram ? 9 : 7,
    displaySize: isTram ? 12 : 7,
    color: isTram ? themeColor("tram") : themeColor("bus"),
    shape: isTram ? "square" : "circle",
    strokeColor: themeColor("pointStroke")
  };
}

function accidentStyle(item) {
  return {
    size: accidentPixelSize(item),
    color: themeColor("accident")
  };
}

function clearEntities(key) {
  const dataSource = state.dataSources.get(key);
  if (dataSource) {
    state.viewer.dataSources.remove(dataSource, true);
    state.dataSources.delete(key);
  }
  const primitives = state.primitiveGroups.get(key) || [];
  for (const primitive of primitives) removeScenePrimitive(primitive);
  state.primitiveGroups.set(key, []);
  const list = state.entities.get(key) || [];
  for (const entity of list) state.viewer.entities.remove(entity);
  state.entities.set(key, []);
  if (key === "selectedQuarter") stopSelectedPulse();
  if (key === "dtp") {
    resetAccidentAnimation();
    clearAccidentCanvas();
  }
  if (key === "roadLabels") state.lastRoadLabelVisible = null;
  if (key === "roadsDetail") state.lastRoadDetailSignature = null;
  if (key === "roads" || key === "roadsMedium" || key === "railways") state.lastLineStyleFactor = null;
  if (key === "trees") {
    state.lastTreeStyle = null;
    window.clearTimeout(state.treeRefreshTimer);
    state.treeRefreshTimer = null;
  }
  requestSceneRender();
}

function rememberEntity(key, entity) {
  if (!state.entities.has(key)) state.entities.set(key, []);
  state.entities.get(key).push(entity);
}

function rememberPrimitive(key, primitive) {
  if (!state.primitiveGroups.has(key)) state.primitiveGroups.set(key, []);
  state.primitiveGroups.get(key).push(primitive);
}

function removeScenePrimitive(primitive) {
  if (!primitive || !state.viewer) return;
  try {
    if (!primitive.isDestroyed?.()) state.viewer.scene.primitives.remove(primitive);
  } catch (error) {
    console.warn("Unable to remove primitive", error);
  }
}

function handleMapClick(position) {
  if (performance.now() < state.suppressClickUntil) return;
  const pickedAccident = pickAccidentOverlay(position);
  const picks = pickedAccident ? [] : state.viewer.scene.drillPick(position, 16) || [];
  const pickedFeature = picks.find((item) => item?.id?.lifeFeature)?.id?.lifeFeature || pickQuarterFallback(position);
  const picked = pickedAccident || state.viewer.scene.pick(position);
  if (!pickedFeature && !Cesium.defined(picked)) {
    clearQuarterSelection();
    return;
  }
  if (picked?.id?.lifeCluster) {
    showAccidentClusterPopup(picked.id.lifeCluster, picked.id.lifeClusterPoint);
    return;
  }
  if (picked?.id?.lifePoint) {
    const item = picked.id.lifePoint;
    if (String(item.properties?.source || "") === "dtp") showAccidentPopup(item);
    else showPointToast(item.properties?.name || "Остановка общественного транспорта");
    return;
  }
  if (pickedFeature) {
    state.selectedFeature = pickedFeature;
    closeAccidentPopup();
    renderSelectedQuarter();
    renderInfo();
    updateUrl();
    return;
  }
  if (picked.id?.lifeCluster) {
    showAccidentClusterPopup(picked.id.lifeCluster, picked.id.lifeClusterPoint);
    return;
  }
  if (picked.id?.lifePoint) {
    const item = picked.id.lifePoint;
    if (String(item.properties?.source || "") === "dtp") showAccidentPopup(item);
    else showPointToast(item.properties?.name || "Остановка общественного транспорта");
  }
  if (picked.id?.lifePoint) return;
  clearQuarterSelection();
}

function clearQuarterSelection() {
  closeAccidentPopup();
  if (!state.selectedFeature) {
    updateUrl();
    return;
  }
  state.selectedFeature = null;
  renderSelectedQuarter();
  renderInfo();
  updateUrl();
}

function pickQuarterFallback(position) {
  if (!state.viewer || !state.visibleLayers.has("quartals") || !state.data?.quartals?.length) return null;
  const tolerance = PICK_EDGE_TOLERANCE * Math.max(1, window.devicePixelRatio || 1);
  for (let i = state.data.quartals.length - 1; i >= 0; i -= 1) {
    const feature = state.data.quartals[i];
    for (const polygon of feature.polygons || []) {
      if (screenPolygonContains(polygon, position, tolerance)) return feature;
    }
  }
  return null;
}

function screenPolygonContains(polygon, position, tolerance) {
  const rings = polygonRings(polygon);
  if (!rings.length) return false;
  const outer = projectRingToScreen(rings[0]);
  if (outer.length < 3) return false;
  const nearOuter = pointNearRing(position, outer, tolerance);
  if (!nearOuter && !pointInScreenRing(position, outer)) return false;
  for (const ring of rings.slice(1)) {
    const hole = projectRingToScreen(ring);
    if (hole.length >= 3 && pointInScreenRing(position, hole) && !pointNearRing(position, hole, tolerance)) return false;
  }
  return true;
}

function projectRingToScreen(ring) {
  const result = [];
  for (const point of ring) {
    const cartesian = Cesium.Cartesian3.fromDegrees(point[0], point[1], (point[2] || 0) + QUARTAL_Z_OFFSET);
    const screen = worldToScreen(cartesian);
    if (screen) result.push(screen);
  }
  return result;
}

function pointInScreenRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i].x;
    const yi = ring[i].y;
    const xj = ring[j].x;
    const yj = ring[j].y;
    const intersects = (yi > point.y) !== (yj > point.y)
      && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointNearRing(point, ring, tolerance) {
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (pointSegmentDistance(point, a, b) <= tolerance) return true;
  }
  return false;
}

function pointSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

function showAccidentPopup(item) {
  state.accidentPopup = item;
  state.accidentPopupCameraSignature = null;
  const p = item.properties || {};
  els.accidentPopup.innerHTML = `
    <button type="button" class="popupClose" aria-label="Закрыть">×</button>
    <strong>${escapeHtml(p.type || "ДТП")}</strong>
    <span>${escapeHtml([p.date, p.time].filter(Boolean).join(", ") || "Дата не указана")}</span>
    <span>Пострадавшие: ${formatInt(Number(p.injured || 0))}</span>
    <span>Погибшие: ${formatInt(Number(p.dead || 0))}</span>
    ${p.address ? `<em>${escapeHtml(p.address)}</em>` : ""}
  `;
  els.accidentPopup.querySelector(".popupClose").onclick = () => {
    closeAccidentPopup();
  };
  els.accidentPopup.addEventListener("wheel", (event) => event.stopPropagation(), { passive: false });
  updateAccidentPopupPosition();
}

function showAccidentClusterPopup(items, point) {
  const accidents = items || [];
  const anchorPoint = point || averagePoint(accidents);
  closeAccidentPopup();
  zoomToAccidentCluster(anchorPoint, { clusterItems: accidents });
}

function renderAccidentClusterPopup(items, point) {
  const accidents = items || [];
  const totalInjured = accidents.reduce((sum, item) => sum + Number(item.properties?.injured || 0), 0);
  const totalDead = accidents.reduce((sum, item) => sum + Number(item.properties?.dead || 0), 0);
  const anchorPoint = point || averagePoint(accidents);
  state.accidentPopup = { point: anchorPoint, properties: { source: "dtp-cluster" } };
  state.accidentPopupCameraSignature = accidentViewSignature();
  els.accidentPopup.innerHTML = `
    <button type="button" class="popupClose" aria-label="Закрыть">×</button>
    <strong>ДТП: ${formatInt(accidents.length)}</strong>
    <span>Пострадавшие: ${formatInt(totalInjured)}</span>
    <span>Погибшие: ${formatInt(totalDead)}</span>
    <div class="accidentList">
      ${accidents.slice(0, 12).map((item) => {
        const p = item.properties || {};
        return `<span>${escapeHtml([p.date, p.time].filter(Boolean).join(", ") || "дата не указана")} · постр. ${formatInt(Number(p.injured || 0))}, погиб. ${formatInt(Number(p.dead || 0))}</span>`;
      }).join("")}
      ${accidents.length > 12 ? `<em>Ещё ${formatInt(accidents.length - 12)} ДТП</em>` : ""}
    </div>
  `;
  els.accidentPopup.querySelector(".popupClose").onclick = () => {
    closeAccidentPopup();
  };
  els.accidentPopup.addEventListener("wheel", (event) => event.stopPropagation(), { passive: false });
  updateAccidentPopupPosition();
}

function updateAccidentPopupPosition() {
  if (!state.accidentPopup || !state.viewer) return;
  const point = state.accidentPopup.point;
  const cart = pointLayerCartesian(point, "dtp");
  const screen = worldToScreen(cart);
  if (!screen) {
    hideAccidentPopup();
    return;
  }
  els.accidentPopup.classList.remove("hidden");
  els.accidentPopup.style.left = `${Math.round(screen.x)}px`;
  els.accidentPopup.style.top = `${Math.round(screen.y - 16)}px`;
}

function zoomToAccidentCluster(point, options = {}) {
  if (!state.viewer || !point) return;
  const camera = state.viewer.camera;
  const target = pointLayerCartesian(point, "dtp");
  const currentRange = Cesium.Cartesian3.distance(camera.positionWC, target);
  const targetRange = Math.min(currentRange, clamp(currentRange * 0.45, 850, 3200));
  camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 80), {
    offset: new Cesium.HeadingPitchRange(
      camera.heading,
      clamp(camera.pitch, Cesium.Math.toRadians(-78), Cesium.Math.toRadians(-35)),
      targetRange
    ),
    duration: 0.9,
    complete: () => {
      updateAccidentClusterEntities(true);
      if (options.clusterItems?.length) {
        if (isSameAccidentClusterStillVisible(options.clusterItems)) {
          renderAccidentClusterPopup(options.clusterItems, point);
        } else {
          closeAccidentPopup();
        }
      } else {
        updateAccidentPopupPosition();
      }
      requestSceneRender();
    }
  });
  requestSceneRender();
}

function isSameAccidentClusterStillVisible(items) {
  const memberKeys = items.map(accidentItemKey).sort();
  if (memberKeys.length <= 1) return false;
  const expectedKey = accidentClusterKey(memberKeys);
  const targets = state.accidentClusterTargets || buildAccidentDisplayItems();
  return targets.some((item) => item.items?.length > 1 && item.key === expectedKey);
}

function shouldCloseAccidentClusterPopupForCamera() {
  if (state.accidentPopup?.properties?.source !== "dtp-cluster") return false;
  if (!state.accidentPopupCameraSignature) return false;
  return accidentViewSignature() !== state.accidentPopupCameraSignature;
}

function closeAccidentPopup() {
  state.accidentPopup = null;
  state.accidentPopupCameraSignature = null;
  hideAccidentPopup();
}

function hideAccidentPopup() {
  els.accidentPopup.classList.add("hidden");
}

function legacyRenderInfo() {
  if (!state.data || !state.activeCity) return;
  const feature = state.selectedFeature;
  const props = feature?.properties;
  const scenario = feature ? props.currentScore : cityScenarioScore();
  const base = feature ? comparisonScore(props) : cityBaseScore();
  const rank = feature ? props.currentRank : state.activeCity.rank;
  const population = feature ? quarterPopulation(props) : state.activeCity.population;
  const blocks = feature ? comparisonBlocks(props) : cityBlocks();
  const indicatorGroups = feature ? groupedIndicators(props.indicators || [], { hideCommerce: state.comparisonMode === "all" }) : [];

  els.infoPanel.innerHTML = `
    <div class="sheetHandle" aria-hidden="true"></div>
    <header class="infoHead">
      <div>
        <div class="eyebrow">${escapeHtml(feature ? state.activeCity.name : "Город")}</div>
        <h2>${escapeHtml(feature ? `Квартал ${props.id || feature.id}` : state.activeCity.name)}</h2>
      </div>
      <label class="compareSwitch" title="Переключить уровень сравнения">
        <input id="comparisonToggle" type="checkbox" ${state.comparisonMode === "all" ? "checked" : ""}>
        <span></span>
        <strong>
          <em class="${state.comparisonMode === "all" ? "active" : ""}">Общегородское</em>
          <b class="${state.comparisonMode === "all" ? "active" : ""}">сравнение</b>
          <em class="${state.comparisonMode === "city" ? "active" : ""}">Внутригородское</em>
        </strong>
      </label>
    </header>
    <div class="metrics">
      ${metric("scenario", "Сценарный индекс", scenario, 2)}
      ${metric("base", "Основной индекс", base, 2)}
      ${metric("rank", "Ранг", rank, 0)}
      ${metric("population", "Численность населения", population, 0)}
    </div>
    <section class="bars">
      ${BLOCKS.map((block) => blockBar(block, blocks?.[block.key], isCommerceDisabledInComparison(block.key))).join("")}
    </section>
    ${indicatorGroups.length ? `
      <section class="indicatorGroups">
        ${indicatorGroups.map((group) => `
          <article>
            <h3>${escapeHtml(group.name)}</h3>
            ${group.items.map((item) => indicatorRow(group.name, item)).join("")}
          </article>
        `).join("")}
      </section>
    ` : ""}
  `;
  els.infoPanel.querySelector("#comparisonToggle").onchange = (event) => {
    state.comparisonMode = event.target.checked ? "all" : "city";
    recomputeScores();
    renderQuartals();
    renderInfo();
    updateUrl();
  };
  for (const trigger of els.infoPanel.querySelectorAll("[data-method-card]")) {
    trigger.onclick = () => showMethodCard(trigger.dataset.methodCard);
  }
}

function legacyMetric(key, label, value, digits) {
  const formatted = digits === 0 ? formatInt(value) : formatNumber(value, digits);
  return `<button class="metric methodTrigger" type="button" data-method-card="metric:${key}"><strong>${formatted}</strong><span>${escapeHtml(label)}</span></button>`;
}

function legacyBlockBar(block, value) {
  if (!Number.isFinite(value) || value === 0) return "";
  const scaled = value <= 1 ? value * 100 : value;
  return `
    <button class="barRow methodTrigger" type="button" data-method-card="block:${block.key}" title="${escapeAttr(block.help)}">
      <span>${escapeHtml(block.label)}</span>
      <em>${formatNumber(scaled, 1)}</em>
      <i><b style="width:${Math.max(0, Math.min(100, scaled))}%; --accent:${block.color}"></b></i>
    </button>
  `;
}

function legacyIndicatorRow(group, item) {
  if (!Number.isFinite(item.value) || item.value === 0) return "";
  const name = item.name || item.label;
  const unit = indicatorUnit(name);
  return `
    <button class="indicatorRow methodTrigger" type="button" data-method-card="indicator:${escapeAttr(group)}|${escapeAttr(name)}">
      <span>${escapeHtml(name)}</span>
      <em>${formatNumber(item.value, 2)}${unit ? ` ${escapeHtml(unit)}` : ""}</em>
    </button>
  `;
}

function groupedIndicators(indicators, options = {}) {
  const groups = new Map();
  for (const item of indicators) {
    if (!Number.isFinite(item.value) || item.value === 0) continue;
    const [rawGroup, rawName] = String(item.label || "").split(":").map((part) => part.trim());
    const group = rawName ? rawGroup : "Показатели";
    const name = rawName || rawGroup || "Показатель";
    if (options.hideCommerce && blockForGroup(group)?.key === "commerce") continue;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ ...item, name });
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
}

function indicatorUnit(name) {
  const normalized = String(name || "").toLowerCase();
  for (const [key, unit] of Object.entries(INDICATOR_UNITS)) {
    if (normalized.includes(key)) return unit;
  }
  return "";
}

function legacyShowMethodCard(key) {
  state.methodCardKey = key;
  const [type, id] = key.split(":");
  let title = "Методика";
  let text = "Показатель помогает сравнивать кварталы между собой и увидеть, какая часть городской среды влияет на итоговую оценку.";
  let extra = "";
  if (type === "metric") {
    title = METHOD_TEXT[id]?.title || title;
    text = METHOD_TEXT[id]?.text || text;
    if (id === "rank") extra = renderRankTable();
  }
  if (type === "block") {
    const block = BLOCKS.find((item) => item.key === id);
    title = block?.label || title;
    text = block?.help || text;
  }
  if (type === "indicator") {
    const [group, name] = id.split("|");
    title = name || title;
    text = `Показатель относится к направлению «${group}». Он показывает одну конкретную сторону городской среды и участвует в общей оценке квартала.`;
  }
  els.methodCard.innerHTML = `
    <button type="button" class="methodClose" aria-label="Закрыть">×</button>
    <div class="methodVisual" data-kind="${escapeAttr(type)}"></div>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(text)}</p>
    ${extra}
  `;
  els.methodCard.querySelector(".methodClose").onclick = () => els.methodCard.classList.add("hidden");
  els.methodCard.classList.remove("hidden");
}

function legacyRenderRankTable() {
  if (!state.data?.quartals?.length) return "";
  const selected = state.selectedFeature;
  const ranked = [...state.data.quartals]
    .filter((feature) => Number.isFinite(feature.properties.currentScore))
    .sort((a, b) => a.properties.currentRank - b.properties.currentRank);
  const selectedRank = selected?.properties?.currentRank || 1;
  const rows = ranked.filter((feature) => {
    const rank = feature.properties.currentRank;
    return rank <= 3 || Math.abs(rank - selectedRank) <= 2 || rank > ranked.length - 3;
  });
  return `
    <table class="rankTable">
      <tbody>
        ${rows.map((feature) => `
          <tr class="${selected && feature.id === selected.id ? "active" : ""}">
            <td>${formatInt(feature.properties.currentRank)}</td>
            <td>Квартал ${escapeHtml(feature.properties.id || feature.id)}</td>
            <td>${formatNumber(feature.properties.currentScore, 1)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderInfo() {
  if (!state.data || !state.activeCity) return;
  const previousValues = captureInfoPanelValues();
  state.infoPreviousValues = previousValues;
  const feature = state.selectedFeature;
  const props = feature?.properties;
  const scenario = feature ? props.currentScore : cityScenarioScore();
  const base = feature ? comparisonScore(props) : cityBaseScore();
  const rank = feature ? props.currentRank : state.activeCity.rank;
  const population = feature ? quarterPopulation(props) : state.activeCity.population;
  const blocks = feature ? comparisonBlocks(props) : cityBlocks();
  const indicatorGroups = feature ? groupedIndicators(props.indicators || [], { hideCommerce: state.comparisonMode === "all" }) : [];

  els.infoPanel.innerHTML = `
    <button class="sheetHandle" type="button" aria-label="Свернуть или раскрыть панель"></button>
    <div class="panelTitle">
      <div class="panelHeading">
        <h2>${escapeHtml(feature ? `Квартал ${props.id || feature.id}` : state.activeCity.name)}</h2>
      </div>
      ${renderComparisonSwitch()}
    </div>
    <div class="metricGrid">
      ${metric("scenario", "Сценарный индекс", scenario, 2)}
      ${metric("base", "Основной индекс", base, 2)}
      ${metric("rank", "Ранг", rank, 0)}
      ${metric("population", "Численность населения", population, 0)}
    </div>
    ${renderMethodCardSlot("metric")}
    <section class="barList">
      ${BLOCKS.map((block) => blockBar(block, blocks?.[block.key], isCommerceDisabledInComparison(block.key))).join("")}
    </section>
    ${renderMethodCardSlot("block")}
    ${indicatorGroups.length ? `
      <section class="indicatorList">
        ${indicatorGroups.map((group) => {
          const block = blockForGroup(group.name);
          return `
            <article class="indicatorGroup">
              <button class="indicatorGroupTitle methodTrigger ${state.methodCardKey === `block:${block?.key || ""}` ? "active" : ""}" type="button" data-method-card="block:${block?.key || ""}" data-tooltip="${escapeAttr(block?.help || "")}" style="--method-color:${block?.color || brandBlockColor("housing", "#256d72")}">${escapeHtml(group.name)}</button>
              ${group.items.map((item) => indicatorRow(group.name, item)).join("")}
              ${renderMethodCardSlot("indicator", group.name)}
            </article>`;
        }).join("")}
      </section>
    ` : ""}
  `;

  const closeMethod = els.infoPanel.querySelector("[data-method-close]");
  if (closeMethod) closeMethod.onclick = () => {
    state.methodCardKey = null;
    renderInfo();
  };
  for (const trigger of els.infoPanel.querySelectorAll("[data-method-card]")) {
    trigger.onclick = () => {
      state.methodCardKey = state.methodCardKey === trigger.dataset.methodCard ? null : trigger.dataset.methodCard;
      renderInfo();
    };
  }
  const comparisonSwitch = els.infoPanel.querySelector(".comparisonSwitch");
  if (comparisonSwitch) {
    comparisonSwitch.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setComparisonMode(state.comparisonMode === "all" ? "city" : "all");
    };
    comparisonSwitch.onkeydown = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      setComparisonMode(state.comparisonMode === "all" ? "city" : "all");
    };
  }
  for (const button of els.infoPanel.querySelectorAll("[data-rank-quarter]")) {
    button.onclick = () => {
      selectQuarterById(button.dataset.rankQuarter);
      renderQuartals();
      renderInfo();
      updateUrl();
    };
  }
  setupInfoPanelGestures();
  animateInfoPanelValues();
  state.infoPreviousValues = null;
}

function setComparisonMode(nextMode) {
  if (SINGLE_CITY_MODE) return false;
  if (!state.data || !state.activeCity) return false;
  if (nextMode === state.comparisonMode) return false;
  state.comparisonTransition = `${state.comparisonMode}->${nextMode}`;
  if (state.comparisonTransitionTimer) clearTimeout(state.comparisonTransitionTimer);
  state.comparisonMode = nextMode;
  clearDisabledCommerceMethodCard();
  recomputeScores();
  renderQuartals();
  renderControls();
  renderInfo();
  updateUrl();
  state.comparisonTransitionTimer = setTimeout(() => {
    state.comparisonTransition = null;
  }, 540);
  return true;
}

function renderComparisonSwitch() {
  if (SINGLE_CITY_MODE) return "";
  const isAll = state.comparisonMode === "all";
  return `
    <button class="comparisonSwitch" type="button" data-comparison-toggle aria-pressed="${isAll}" aria-label="Переключить уровень сравнения">
      <span class="comparisonToggle ${isAll ? "isAll" : "isCity"}" aria-hidden="true">
        <span></span>
      </span>
      <div class="comparisonLabels">
        <span class="comparisonLabel comparisonLabelTop ${isAll ? "active" : ""}">Общегородское</span>
        <span class="comparisonShared active">сравнение</span>
        <span class="comparisonLabel comparisonLabelBottom ${isAll ? "" : "active"}">Внутригородское</span>
      </div>
    </button>
  `;
}

function metric(key, label, value, digits) {
  const formatted = digits === 0 ? formatInt(value) : formatNumber(value, digits);
  const start = state.infoPreviousValues?.metrics?.get(key);
  const startValue = Number.isFinite(start) ? start : Number(value);
  const display = Number.isFinite(start) ? (digits === 0 ? formatInt(start) : formatNumber(start, digits)) : formatted;
  const active = state.methodCardKey === `metric:${key}` ? " active" : "";
  const colors = {
    scenario: brandBlockColor("housing", "#256d72"),
    base: brandBlockColor("commerce", "#b88624"),
    rank: brandBlockColor("work", "#7b5796"),
    population: brandBlockColor("green", "#477f5b")
  };
  return `<button class="metric methodTrigger${active}" type="button" data-method-card="metric:${key}" data-metric-key="${key}" style="--method-color:${colors[key] || brandBlockColor("housing", "#256d72")}"><strong data-animate-number data-current-value="${Number(value)}" data-start-value="${startValue}" data-target-value="${Number(value)}" data-digits="${digits}">${display}</strong><span>${escapeHtml(label)}</span></button>`;
}

function blockBar(block, value, disabled = false) {
  const numericValue = Number.isFinite(value) ? value : 0;
  const scaled = numericValue <= 1 ? numericValue * 100 : numericValue;
  const clamped = Math.max(0, Math.min(100, scaled));
  const start = state.infoPreviousValues?.bars?.get(block.key);
  const startValue = Number.isFinite(start) ? start : clamped;
  const active = !disabled && state.methodCardKey === `block:${block.key}` ? " active" : "";
  const transitionClass = block.key === "commerce" && state.comparisonTransition
    ? disabled ? " commerceDisabling" : " commerceEnabling"
    : "";
  const methodClass = disabled ? " isDisabled" : " methodTrigger";
  const methodAttrs = disabled
    ? `disabled aria-disabled="true" data-tooltip="Экономика не участвует в общегородском сравнении"`
    : `data-method-card="block:${block.key}" data-tooltip="${escapeAttr(block.help)}"`;
  const fillColor = disabled ? "var(--disabled-ink, var(--muted))" : block.color;
  return `
    <button class="barRow${methodClass}${active}${transitionClass}" type="button" ${methodAttrs} data-bar-key="${block.key}" style="--method-color:${block.color}; --bar-fill-color:${fillColor}">
      <span class="helpText">${escapeHtml(block.label)}</span>
      <div class="barTrack"><div class="barFill" data-bar-fill data-start-value="${startValue}" data-target-value="${clamped}" style="width:${startValue}%"></div></div>
      <strong data-animate-number data-current-value="${clamped}" data-start-value="${startValue}" data-target-value="${clamped}" data-digits="0">${formatNumber(startValue, 0)}</strong>
    </button>
  `;
}

function captureInfoPanelValues() {
  const values = { metrics: new Map(), bars: new Map() };
  if (!els.infoPanel) return values;
  for (const node of els.infoPanel.querySelectorAll("[data-metric-key] strong[data-current-value]")) {
    const key = node.closest("[data-metric-key]")?.dataset.metricKey;
    const value = Number(node.dataset.currentValue);
    if (key && Number.isFinite(value)) values.metrics.set(key, value);
  }
  for (const node of els.infoPanel.querySelectorAll("[data-bar-key] strong[data-current-value]")) {
    const key = node.closest("[data-bar-key]")?.dataset.barKey;
    const value = Number(node.dataset.currentValue);
    if (key && Number.isFinite(value)) values.bars.set(key, value);
  }
  return values;
}

function animateInfoPanelValues() {
  const numberNodes = [...els.infoPanel.querySelectorAll("[data-animate-number]")];
  const fillNodes = [...els.infoPanel.querySelectorAll("[data-bar-fill]")];
  if (!numberNodes.length && !fillNodes.length) return;
  const duration = 720;
  const started = performance.now();
  const numbers = numberNodes.map((node) => ({
    node,
    start: Number(node.dataset.startValue),
    target: Number(node.dataset.targetValue),
    digits: Number(node.dataset.digits || 0)
  })).filter((item) => Number.isFinite(item.start) && Number.isFinite(item.target));
  const fills = fillNodes.map((node) => ({
    node,
    start: Number(node.dataset.startValue),
    target: Number(node.dataset.targetValue)
  })).filter((item) => Number.isFinite(item.start) && Number.isFinite(item.target));

  function frame(now) {
    const t = clamp((now - started) / duration, 0, 1);
    const eased = t * t * (3 - 2 * t);
    for (const item of numbers) {
      const value = item.start + (item.target - item.start) * eased;
      item.node.textContent = item.digits === 0 ? formatInt(value) : formatNumber(value, item.digits);
      item.node.dataset.currentValue = String(value);
    }
    for (const item of fills) {
      const value = item.start + (item.target - item.start) * eased;
      item.node.style.width = `${Math.max(0, Math.min(100, value))}%`;
    }
    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }
    for (const item of numbers) {
      item.node.textContent = item.digits === 0 ? formatInt(item.target) : formatNumber(item.target, item.digits);
      item.node.dataset.currentValue = String(item.target);
    }
    for (const item of fills) item.node.style.width = `${Math.max(0, Math.min(100, item.target))}%`;
  }

  requestAnimationFrame(frame);
}

function indicatorRow(group, item) {
  if (!Number.isFinite(item.value) || item.value === 0) return "";
  const name = item.name || item.label;
  const unit = indicatorUnit(name);
  const key = `indicator:${group}|${name}`;
  const active = state.methodCardKey === key ? " active" : "";
  const block = blockForGroup(group);
  return `
    <button class="indicator methodTrigger${active}" type="button" data-method-card="${escapeAttr(key)}" data-tooltip="${escapeAttr(indicatorHelp(group, name))}" style="--method-color:${block?.color || brandBlockColor("housing", "#256d72")}">
      <span>${escapeHtml(name)}</span>
      <em>${escapeHtml(unit)}</em>
      <strong>${formatNumber(item.value, 2)}</strong>
    </button>
  `;
}

function renderMethodCardSlot(slot, groupName = "") {
  const key = state.methodCardKey || "";
  if (state.comparisonMode === "all" && isCommerceMethodKey(key)) return "";
  if (slot === "metric" && key.startsWith("metric:")) return renderActiveMethodCard(slot);
  if (slot === "block" && key.startsWith("block:")) return renderActiveMethodCard(slot);
  if (slot === "indicator" && key.startsWith("indicator:")) {
    const active = activeIndicatorMethodParts(key);
    if (active && normalizeMethodText(active.group) === normalizeMethodText(groupName)) return renderActiveMethodCard(slot);
  }
  return "";
}

function activeIndicatorMethodParts(key = state.methodCardKey) {
  if (!key?.startsWith("indicator:")) return null;
  const raw = key.slice("indicator:".length);
  const separator = raw.indexOf("|");
  if (separator < 0) return { group: "", name: raw };
  return {
    group: raw.slice(0, separator),
    name: raw.slice(separator + 1)
  };
}

function renderActiveMethodCard(slot = "") {
  if (!state.methodCardKey) return "";
  const data = methodCardData(state.methodCardKey);
  if (!data) return "";
  const color = data.color || methodVisualColor(data.visual);
  const slotClass = slot ? ` methodCard--${slot}` : "";
  return `
    <section class="methodCard${slotClass}" style="--method-color:${color}" aria-live="polite">
      <button class="methodClose" type="button" data-method-close aria-label="Закрыть">×</button>
      <h3>${escapeHtml(data.title)}</h3>
      <p>${escapeHtml(data.text)}</p>
      ${renderMethodVisual(data)}
      ${data.bullets?.length ? `<ul>${data.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      ${data.extra || ""}
    </section>
  `;
}

function methodCardData(key) {
  if (key.startsWith("metric:")) {
    const id = key.slice("metric:".length);
    const metric = METHOD_TEXT[id];
    if (!metric) return null;
    return {
      ...metric,
      visual: id,
      color: methodVisualColor(id),
      bullets: metricBullets(id),
      extra: id === "rank" ? renderRankTable() : ""
    };
  }
  if (key.startsWith("block:")) {
    const id = key.slice("block:".length);
    const block = BLOCKS.find((item) => item.key === id);
    if (!block) return null;
    return {
      title: block.label,
      text: blockMethodText(block),
      visual: id,
      asset: METHOD_VISUAL_ASSETS[id],
      color: block.color,
      bullets: blockBullets(block)
    };
  }
  if (key.startsWith("indicator:")) {
    const raw = key.slice("indicator:".length);
    const separator = raw.indexOf("|");
    const group = separator >= 0 ? raw.slice(0, separator) : "";
    const name = separator >= 0 ? raw.slice(separator + 1) : raw;
    const block = blockForGroup(group);
    return {
      title: capitalizeMethodTitle(name || "Показатель"),
      text: indicatorMethodText(group, name),
      visual: "indicator",
      asset: indicatorVisualAssetByDescription(group, name),
      color: block?.color || brandBlockColor("housing", "#256d72"),
      bullets: indicatorMethodNotes(group, name)
    };
  }
  return null;
}

function renderMethodVisual(data) {
  const color = data.color || methodVisualColor(data.visual);
  const asset = methodVisualAsset(data);
  if (asset) {
    const lightSrc = `${METHOD_VISUAL_ASSET_BASE}/light/${asset}.svg`;
    const darkSrc = `${METHOD_VISUAL_ASSET_BASE}/dark/${asset}.svg`;
    return `
      <figure class="methodVisual methodVisualAsset" style="--method-color:${color}" aria-hidden="true">
        <img class="methodVisualImg methodVisualImgLight" src="${escapeAttr(lightSrc)}" width="420" height="180" alt="" loading="lazy" decoding="async">
        <img class="methodVisualImg methodVisualImgDark" src="${escapeAttr(darkSrc)}" width="420" height="180" alt="" loading="lazy" decoding="async">
      </figure>
    `;
  }
  if (data.visual === "scenario") return `
    <div class="methodVisual methodVisualScenario" style="--method-color:${color}">
      <div class="methodLayerStack">
        ${BLOCKS.map((block) => `<span style="--chip-color:${block.color}">${escapeHtml(block.label)}</span>`).join("")}
      </div>
      <div class="methodArrow"></div>
      <div class="methodScoreBubble">итог<br>по включенным</div>
    </div>
  `;
  if (data.visual === "base") return `
    <div class="methodVisual methodVisualBase" style="--method-color:${color}">
      <div class="methodStackedCards"><span></span><span></span><span></span></div>
      <div class="methodScoreBubble">полная<br>оценка</div>
    </div>
  `;
  if (data.visual === "rank") return `
    <div class="methodVisual methodVisualRank" style="--method-color:${color}">
      <div class="rankPodium"><span>2</span><strong>1</strong><span>3</span></div>
      <div class="rankLine"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
  `;
  if (data.visual === "population") return `
    <div class="methodVisual methodVisualPopulation" style="--method-color:${color}">
      <div class="miniBlocks"><span></span><span></span><span></span><span></span></div>
      <div class="peopleDots">${Array.from({ length: 15 }, (_, index) => `<i style="--i:${index}"></i>`).join("")}</div>
    </div>
  `;
  return `
    <div class="methodVisual methodVisualBlock" style="--method-color:${color}">
      <div class="miniMapShape"><span></span><span></span><span></span></div>
      <div class="methodChips">${(data.bullets || []).slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
    </div>
  `;
}

function methodVisualAsset(data) {
  return data.asset || METHOD_VISUAL_ASSETS[data.visual] || METHOD_VISUAL_ASSETS.indicator;
}

function indicatorMethodAsset(group, name) {
  const block = blockForGroup(group);
  const normalized = normalizeMethodText(name);
  if (block?.key === "housing") {
    if (normalized.includes("РїР»РѕС‚РЅРѕСЃС‚СЊ")) return "indicator-housing-density";
    if (normalized.includes("РѕР±РµСЃРїРµС‡РµРЅРЅРѕСЃС‚СЊ")) return "indicator-housing-supply";
    if (normalized.includes("РёР·РЅРѕСЃ")) return "indicator-housing-wear";
    if (normalized.includes("СЌС‚Р°Р¶РЅРѕСЃС‚СЊ")) return "indicator-housing-floors";
  }
  if (block?.key === "infra") {
    if (normalized.includes("СЂР°Р·РЅРѕРѕР±СЂР°Р·РёРµ")) return "indicator-infra-diversity";
    if (normalized.includes("РїРѕР»РЅРѕС‚Р°")) return "indicator-infra-basket";
  }
  if (block?.key === "transport") return "indicator-transport-access";
  if (block?.key === "work") {
    if (normalized.includes("РѕР±РµСЃРїРµС‡РµРЅРЅРѕСЃС‚СЊ")) return "indicator-work-access";
    if (normalized.includes("РїР»РѕС‚РЅРѕСЃС‚СЊ")) return "indicator-work-density";
  }
  if (block?.key === "green") return "indicator-green-access";
  if (block?.key === "commerce") {
    if (normalized.includes("Р°РєС‚РёРІРЅРѕСЃС‚СЊ")) return "indicator-commerce-activity";
    if (normalized.includes("РєРєС‚")) return "indicator-commerce-registers";
    if (normalized.includes("С‡РµРє")) return "indicator-commerce-check";
  }
  return METHOD_VISUAL_ASSETS.indicator;
}

function indicatorVisualAssetByDescription(group, name) {
  const block = blockForGroup(group);
  const normalized = normalizeMethodText(name);
  if (block?.key === "housing") {
    if (normalized.includes("плотность")) return "indicator-housing-density";
    if (normalized.includes("обеспеченность")) return "indicator-housing-supply";
    if (normalized.includes("износ")) return "indicator-housing-wear";
    if (normalized.includes("этажность")) return "indicator-housing-floors";
  }
  if (block?.key === "infra") {
    if (normalized.includes("разнообразие")) return "indicator-infra-diversity";
    if (normalized.includes("полнота")) return "indicator-infra-basket";
  }
  if (block?.key === "transport") return "indicator-transport-access";
  if (block?.key === "work") {
    if (normalized.includes("обеспеченность") || normalized.includes("доступность")) return "indicator-work-access";
    if (normalized.includes("плотность")) return "indicator-work-density";
  }
  if (block?.key === "green") return "indicator-green-access";
  if (block?.key === "commerce") {
    if (normalized.includes("активность") || normalized.includes("фнс")) return "indicator-commerce-activity";
    if (normalized.includes("ккт")) return "indicator-commerce-registers";
    if (normalized.includes("чек")) return "indicator-commerce-check";
  }
  return METHOD_VISUAL_ASSETS.indicator;
}

function capitalizeMethodTitle(value) {
  const text = String(value || "").trim();
  if (!text) return "Показатель";
  return text[0].toLocaleUpperCase("ru-RU") + text.slice(1)
    .replace(/\bккт\b/giu, "ККТ")
    .replace(/\bфнс\b/giu, "ФНС");
}

function blockMethodText(block) {
  if (block.key === "housing") return "Оценивает жилую среду квартала: насколько плотно он заселён, хватает ли жителям площади, в каком состоянии дома и какой высоты застройка.";
  if (block.key === "infra") return "Оценивает повседневные места рядом с кварталом: магазины, услуги и другие функции, которыми жители пользуются в обычной городской жизни.";
  if (block.key === "transport") return "Оценивает, насколько удобно жителям дойти до остановок общественного транспорта и уехать в другие части города.";
  if (block.key === "work") return "Оценивает близость крупных работодателей и рабочих мест. Чем лучше показатель, тем проще связать квартал с местами занятости.";
  if (block.key === "green") return "Оценивает, есть ли рядом парки, скверы и другие зелёные территории, до которых можно дойти пешком.";
  if (block.key === "commerce") return "Оценивает деловую активность территории: торговые точки, кассы, покупки и признаки работы организаций. Этот субиндекс используется только во внутригородском сравнении: при общегородском сравнении он отключается.";
  return block.help || "Показывает отдельную сторону качества городской среды.";
}

function indicatorMethodText(group, name) {
  const block = blockForGroup(group);
  const normalized = normalizeMethodText(name);
  if (block?.key === "housing") {
    if (normalized.includes("плотность")) return "Показывает, сколько жителей приходится на гектар территории. Так видно, где квартал заселён плотнее, а где свободнее.";
    if (normalized.includes("обеспеченность")) return "Показывает, сколько жилой площади в среднем приходится на одного жителя квартала.";
    if (normalized.includes("износ")) return "Показывает состояние жилого фонда только по многоквартирным домам. Чем выше износ, тем больше домов требует обновления.";
    if (normalized.includes("этажность")) return "Показывает среднюю высоту жилой застройки только по многоквартирным домам: низкие, средние или многоэтажные дома преобладают в квартале.";
  }
  if (block?.key === "infra") {
    if (normalized.includes("разнообразие")) return "Показывает, насколько разные типы повседневных сервисов есть рядом с жителями, а не сосредоточен ли квартал только на одном виде услуг.";
    if (normalized.includes("полнота")) return "Показывает, какая часть повседневной корзины есть рядом с кварталом. В неё входят продукты, аптеки, пункты выдачи, бытовые услуги, образование, медицина, госуслуги, торговля, общепит и досуг.";
  }
  if (block?.key === "transport") return "Показывает, какая часть жителей находится в удобной пешей доступности от остановок общественного транспорта.";
  if (block?.key === "work") {
    if (normalized.includes("обеспеченность") || normalized.includes("доступность")) return "Показывает, насколько рядом с кварталом есть крупные работодатели и рабочие места.";
    if (normalized.includes("плотность")) return "Показывает концентрацию крупных работодателей на территории: где рабочие места собраны плотнее.";
  }
  if (block?.key === "green") {
    if (normalized.includes("покрытие")) return "Показывает долю площади квартала, покрытую зелёной растительностью по снимку Sentinel. Чем выше значение, тем больше зелени внутри самого квартала.";
    if (normalized.includes("температур")) return "Показывает среднюю температуру поверхности квартала по снимкам Landsat. В индексе более прохладные кварталы получают более высокий балл.";
    return "Показывает, насколько близко к жителям находятся парки, скверы и другие зелёные зоны.";
  }
  if (block?.key === "commerce") {
    if (normalized.includes("активность") || normalized.includes("фнс")) return "Показывает деловую активность территории по признакам работы организаций и торговых точек.";
    if (normalized.includes("ккт")) return "ККТ — это контрольно-кассовая техника: кассы, через которые проходят покупки и услуги. Показатель помогает понять, насколько территория насыщена работающей торговлей и сервисами.";
    if (normalized.includes("чек")) return "Показывает типичный размер покупки на территории по медианному чеку.";
  }
  return `${capitalizeMethodTitle(name)} показывает одну конкретную сторону городской среды и помогает понять, почему территория получила такую оценку.`;
}

function indicatorMethodNotes(group, name) {
  const block = blockForGroup(group);
  const normalized = normalizeMethodText(name);
  if (block?.key === "housing") {
    if (normalized.includes("плотность")) return ["Важно смотреть вместе с площадью жилья: плотный квартал может быть комфортным, если жителям хватает пространства и сервисов.", "Помогает увидеть территории с повышенной нагрузкой на дворы, дороги и инфраструктуру."];
    if (normalized.includes("обеспеченность")) return ["Показывает не только количество домов, а именно жилую площадь в пересчёте на жителей.", "Низкое значение может говорить о тесной жилой среде даже там, где домов много."];
    if (normalized.includes("износ")) return ["Сам по себе возраст дома не всегда плох, но высокий износ снижает качество квартала."];
    if (normalized.includes("этажность")) return ["Показатель помогает понять визуальный масштаб квартала и нагрузку на территорию."];
  }
  if (block?.key === "infra") {
    if (normalized.includes("разнообразие")) return ["Высокое разнообразие означает, что рядом есть разные повседневные функции, а не один тип объектов.", "Такой квартал обычно удобнее в быту: меньше поездок ради простых ежедневных задач."];
    if (normalized.includes("полнота")) return ["Здесь важна не сумма объектов, а наличие разных нужных функций рядом с жителями."];
  }
  if (block?.key === "transport") return ["Чем выше значение, тем больше жителей может дойти до остановки без долгого пешего пути.", "Показатель показывает удобство первого шага поездки: от дома до общественного транспорта."];
  if (block?.key === "work") {
    if (normalized.includes("обеспеченность") || normalized.includes("доступность")) return ["Показывает, есть ли рядом с кварталом значимые места занятости.", "Хорошее значение снижает зависимость от дальних поездок на работу."];
    if (normalized.includes("плотность")) return ["Помогает увидеть территории, где крупные работодатели сконцентрированы особенно плотно.", "Полезно для понимания деловых узлов города и зон ежедневного притяжения."];
  }
  if (block?.key === "green") {
    if (normalized.includes("покрытие")) return ["Показатель дополняет доступность парков: квартал может быть близко к парку, но иметь мало зелени внутри.", "Используется как процент площади квартала с зелёным покровом."];
    if (normalized.includes("температур")) return ["Температура поверхности показывает тепловой стресс территории: перегретые кварталы получают меньший вклад в зелёный субиндекс.", "Показатель учитывается в обратной нормировке: ниже температура — выше балл."];
    return ["Показывает не просто наличие зелени на карте, а удобство доступа к ней для жителей.", "Высокое значение означает, что парк или сквер находится рядом, а не только в другой части города."];
  }
  if (block?.key === "commerce") {
    if (normalized.includes("активность") || normalized.includes("фнс")) return ["Помогает увидеть, где городская экономика заметнее проявляется в повседневной жизни.", "Показатель дополняет карту объектов: он отражает признаки реальной активности, а не только наличие зданий."];
    if (normalized.includes("ккт")) return ["Это косвенный признак живой городской функции: покупки, сервисы и поток клиентов."];
    if (normalized.includes("чек")) return ["Медианный чек показывает типичный размер покупки, без сильного влияния единичных крупных трат.", "Показатель помогает отличать территории с разным уровнем потребительской активности."];
  }
  return [];
}

function methodVisualColor(type) {
  if (type === "rank") return brandBlockColor("work", "#7b5796");
  if (type === "population") return brandBlockColor("green", "#477f5b");
  if (type === "base") return brandBlockColor("commerce", "#b88624");
  return brandBlockColor("housing", "#256d72");
}

function metricBullets(id) {
  if (id === "scenario") return ["Меняется, когда включаются или выключаются сценарии индекса.", "Помогает увидеть, какие направления сильнее влияют на квартал."];
  if (id === "base") return ["Показывает полную оценку без пользовательского сценария.", "Удобен как исходная точка сравнения."];
  if (id === "rank") return ["Меньшее число означает более высокое место.", "Таблица ниже показывает соседей по рейтингу."];
  if (id === "population") return ["Для квартала это оценка числа жителей внутри его границ.", "Для города показана общая численность населения."];
  return [];
}

function blockBullets(block) {
  if (block.key === "housing") return ["Плотность", "Обеспеченность", "Износ", "Этажность"];
  if (block.key === "infra") return ["Повседневные места", "Разнообразие", "Полнота набора услуг"];
  if (block.key === "transport") return ["Остановки", "Пешеходная доступность", "Связь с городом"];
  if (block.key === "work") return ["Крупные работодатели", "Доступность рабочих мест"];
  if (block.key === "green") return ["Парки", "Скверы", "Зелёные территории"];
  if (block.key === "commerce") return ["Деловая активность", "Потребительская активность", "Только внутригородское сравнение"];
  return [];
}

function renderRankTable() {
  if (!state.data?.quartals?.length) return "";
  const selected = state.selectedFeature;
  const ranked = [...state.data.quartals]
    .filter((feature) => Number.isFinite(feature.properties.currentScore))
    .sort((a, b) => a.properties.currentRank - b.properties.currentRank);
  const rows = rankMethodRows(ranked, selected);
  return `
    <div class="rankMethodTableWrap">
      <strong class="rankMethodTitle">${selected ? "Соседние кварталы в рейтинге" : "Города в рейтинге"}</strong>
      <table class="rankMethodTable">
        <tbody>
          ${rows.map((item) => {
            if (item.type === "gap") return `<tr class="rankGap"><td colspan="3">…</td></tr>`;
            const feature = item.feature;
            const id = feature.properties.id || feature.id;
            const isCurrent = selected && String(feature.id) === String(selected.id);
            return `
            <tr class="${isCurrent ? "current" : ""}">
              <td>${formatInt(feature.properties.currentRank)} место</td>
              <td><button type="button" data-rank-quarter="${escapeAttr(id)}">Квартал ${escapeHtml(id)}</button></td>
              <td>${formatNumber(feature.properties.currentScore, 1)}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function rankMethodRows(ranked, selected) {
  const total = ranked.length;
  if (!total) return [];
  const selectedIndex = selected
    ? ranked.findIndex((feature) => String(feature.id) === String(selected.id))
    : -1;
  const indexes = [0, 1];
  if (selectedIndex >= 0) {
    indexes.push(selectedIndex - 1, selectedIndex, selectedIndex + 1);
  }
  indexes.push(total - 2, total - 1);
  const compact = [...new Set(indexes.filter((index) => index >= 0 && index < total))]
    .sort((a, b) => a - b);
  const rows = [];
  compact.forEach((index, position) => {
    if (position > 0 && index - compact[position - 1] > 1) rows.push({ type: "gap" });
    rows.push({ type: "feature", feature: ranked[index] });
  });
  return rows;
}

function normalizeMethodText(value) {
  return String(value || "").trim().toLowerCase().replace(/С‘/g, "Рµ");
}

function blockForGroup(group) {
  const normalized = String(group || "").toLowerCase().replace(/ё/g, "е");
  if (normalized.includes("жиль")) return BLOCKS.find((block) => block.key === "housing");
  if (normalized.includes("коммерчес")) return BLOCKS.find((block) => block.key === "infra");
  if (normalized.includes("транспорт")) return BLOCKS.find((block) => block.key === "transport");
  if (normalized.includes("работ")) return BLOCKS.find((block) => block.key === "work");
  if (normalized.includes("зелен")) return BLOCKS.find((block) => block.key === "green");
  if (normalized.includes("эконом")) return BLOCKS.find((block) => block.key === "commerce");
  return null;
}

function indicatorHelp(group, name) {
  const block = blockForGroup(group);
  if (block) return `${name} — один из показателей направления «${block.label}». Он показывает отдельную сторону городской среды и участвует в общей оценке квартала.`;
  return `${name} — показатель, который помогает объяснить итоговую оценку квартала.`;
}

function renderLegends() {
  if (state.visibleLayers.has("quartals")) {
    els.legend.innerHTML = `
      <strong class="legendTitle">Сценарный индекс</strong>
      <div class="legendGradient"></div>
      <div class="legendScale"><span>0</span><span>50</span><span>100</span></div>
    `;
    els.legend.classList.remove("hidden");
    els.legend.classList.remove("legendHidden");
  } else {
    els.legend.classList.add("legendHidden");
  }
  const parts = [];
  if (state.visibleLayers.has("stops")) {
    parts.push(`<div><i class="dot bus"></i><span>Автобусная остановка</span></div><div><i class="dot tram"></i><span>Трамвайная остановка</span></div>`);
  }
  if (state.visibleLayers.has("dtp")) {
    parts.push(`<div><i class="dot accident"></i><span>ДТП, размер зависит от пострадавших</span></div>`);
  }
  els.symbolLegend.innerHTML = parts.join("");
  els.symbolLegend.classList.toggle("hidden", !parts.length);
  els.symbolLegend.classList.toggle("legendOffset", state.visibleLayers.has("quartals") && parts.length > 0);
}

function renderTutorial() {
  const isMobile = matchMedia("(max-width: 760px)").matches;
  if (isMobile) {
    els.tutorial.classList.add("hidden");
    return;
  }
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch (error) {}
  if (dismissed) return;
  els.tutorial.innerHTML = `
    <div class="tutorialGrid">
      <p><span>ЛКМ</span> движение карты</p>
      <p><span>ПКМ</span> угол и наклон</p>
      <p><span>Колесо</span> приближение и отдаление</p>
    </div>
    <button class="tutorialClose" type="button" aria-label="Закрыть">×</button>
  `;
  els.tutorial.querySelector("button").onclick = () => {
    els.tutorial.classList.add("hidden");
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch (error) {}
  };
  els.tutorial.classList.remove("hidden");
}

function setupInfoPanelGestures() {
  if (!matchMedia("(max-width: 760px)").matches) {
    els.infoPanel.classList.remove("sheetExpanded");
    return;
  }
  els.infoPanel.classList.toggle("sheetExpanded", state.infoExpanded);
  let startY = 0;
  els.infoPanel.onpointerdown = (event) => {
    startY = event.clientY;
  };
  els.infoPanel.onpointerup = (event) => {
    const delta = event.clientY - startY;
    if (delta < -35) state.infoExpanded = true;
    if (delta > 35) state.infoExpanded = false;
    els.infoPanel.classList.toggle("sheetExpanded", state.infoExpanded);
  };
}

function recomputeScores() {
  if (!state.data) return;
  const comparableKeys = comparableBlockKeys();
  const active = comparableKeys.filter((key) => state.activeBlocks.has(key));
  const fullScenario = active.length === comparableKeys.length && comparableKeys.every((key) => state.activeBlocks.has(key));
  for (const feature of state.data.quartals) {
    feature.properties.previousScore = feature.properties.currentScore;
    const baseScore = comparisonScore(feature.properties);
    if (fullScenario && Number.isFinite(baseScore)) {
      feature.properties.currentScore = baseScore;
      feature.properties.currentRank = comparisonRank(feature.properties);
      continue;
    }
    const blocks = comparisonBlocks(feature.properties);
    const values = active.map((key) => blocks?.[key]).filter(Number.isFinite);
    feature.properties.currentScore = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length * 100 : null;
  }
  const ranked = state.data.quartals
    .filter((feature) => Number.isFinite(feature.properties.currentScore))
    .sort((a, b) => b.properties.currentScore - a.properties.currentScore);
  ranked.forEach((feature, index) => {
    if (!fullScenario) feature.properties.currentRank = index + 1;
  });
}

function isCommerceDisabledInComparison(key) {
  return state.comparisonMode === "all" && key === "commerce";
}

function isCommerceMethodKey(key = "") {
  key = String(key || "");
  if (key === "block:commerce") return true;
  if (!key.startsWith("indicator:")) return false;
  const active = activeIndicatorMethodParts(key);
  return blockForGroup(active?.group)?.key === "commerce";
}

function clearDisabledCommerceMethodCard() {
  if (state.comparisonMode === "all" && isCommerceMethodKey(state.methodCardKey)) {
    state.methodCardKey = null;
  }
}

function comparableBlockKeys() {
  return BLOCKS
    .map((block) => block.key)
    .filter((key) => state.comparisonMode !== "all" || key !== "commerce");
}

function comparisonData(properties) {
  return properties?.compare?.[state.comparisonMode] || null;
}

function comparisonBlocks(properties) {
  return comparisonData(properties)?.blocks || properties?.blocks || {};
}

function comparisonScore(properties) {
  return comparisonData(properties)?.score ?? properties?.baseScore ?? null;
}

function comparisonRank(properties) {
  return comparisonData(properties)?.rank ?? properties?.baseRank ?? null;
}

function quarterPopulation(properties) {
  const population = Number(properties?.population);
  if (Number.isFinite(population)) return population;
  const popSum2 = Number(properties?.pop_sum2);
  if (Number.isFinite(popSum2)) return popSum2;
  const popSumAlt = Number(properties?.pop_sum_2);
  if (Number.isFinite(popSumAlt)) return popSumAlt;
  const popSum = Number(properties?.pop_sum);
  return Number.isFinite(popSum) ? popSum : null;
}

function featurePopulation(feature) {
  return quarterPopulation(feature?.properties);
}

function cityScenarioScore() {
  let weighted = 0;
  let total = 0;
  for (const feature of state.data.quartals) {
    const score = feature.properties.currentScore;
    const weight = featurePopulation(feature);
    if (!Number.isFinite(score) || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += score * weight;
    total += weight;
  }
  return total > 0 ? weighted / total : state.activeCity.index;
}

function cityBaseScore() {
  let weighted = 0;
  let total = 0;
  for (const feature of state.data.quartals) {
    const score = comparisonScore(feature.properties);
    const weight = featurePopulation(feature);
    if (!Number.isFinite(score) || !Number.isFinite(weight) || weight <= 0) continue;
    weighted += score * weight;
    total += weight;
  }
  return total > 0 ? weighted / total : state.activeCity.index;
}

function cityBlocks() {
  const result = {};
  for (const block of BLOCKS) {
    let weighted = 0;
    let total = 0;
    for (const feature of state.data.quartals) {
      const value = comparisonBlocks(feature.properties)?.[block.key];
      const weight = featurePopulation(feature);
      if (!Number.isFinite(value) || !Number.isFinite(weight) || weight <= 0) continue;
      weighted += value * 100 * weight;
      total += weight;
    }
    result[block.key] = total > 0 ? weighted / total : null;
  }
  return result;
}

function selectQuarterById(id) {
  if (!id || !state.data) return;
  state.selectedFeature = state.data.quartals.find((feature) => String(feature.id) === String(id) || String(feature.properties?.id) === String(id)) || null;
  renderSelectedQuarter();
  renderInfo();
}

function flyToCity(animated) {
  if (!state.viewer || !state.data) return;
  const center = startViewCenter();
  const isMobile = matchMedia("(max-width: 760px)").matches;
  const targetHeight = Number.isFinite(center[2]) ? Math.max(0, center[2] - 90) : 0;
  const target = Cesium.Cartesian3.fromDegrees(center[0], center[1], targetHeight);
  const offset = new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-56), isMobile ? 4700 : 6200);
  if (animated) {
    state.viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), {
      offset,
      duration: 1.15
    });
  } else {
    state.viewer.camera.lookAt(target, offset);
    state.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }
  requestSceneRender();
}

function startViewCenter() {
  const feature = startViewQuarter();
  return feature ? quarterVisualCenter(feature) : (state.data.center || [state.activeCity.center[0], state.activeCity.center[1], 120]);
}

function startViewQuarter() {
  const id = START_VIEW_QUARTER_IDS[state.activeCity?.slug];
  if (!id || !state.data?.quartals?.length) return null;
  return state.data.quartals.find((feature) => String(feature.id) === id || String(feature.properties?.id) === id) || null;
}

function quarterVisualCenter(feature) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  let heightSum = 0;
  let heightCount = 0;
  for (const polygon of feature?.polygons || []) {
    for (const ring of polygon || []) {
      for (const point of ring || []) {
        const lon = Number(point?.[0]);
        const lat = Number(point?.[1]);
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
        minLon = Math.min(minLon, lon);
        minLat = Math.min(minLat, lat);
        maxLon = Math.max(maxLon, lon);
        maxLat = Math.max(maxLat, lat);
        const height = Number(point?.[2]);
        if (Number.isFinite(height)) {
          heightSum += height;
          heightCount += 1;
        }
      }
    }
  }
  if (!Number.isFinite(minLon) || !Number.isFinite(minLat) || !Number.isFinite(maxLon) || !Number.isFinite(maxLat)) {
    return state.data.center || [state.activeCity.center[0], state.activeCity.center[1], 120];
  }
  const fallbackHeight = Number(state.data?.center?.[2] ?? state.activeCity?.center?.[2] ?? 120);
  return [
    (minLon + maxLon) / 2,
    (minLat + maxLat) / 2,
    heightCount ? heightSum / heightCount : fallbackHeight
  ];
}

function rotateNorth() {
  if (!state.viewer) return;
  const camera = state.viewer.camera;
  const cartographic = camera.positionCartographic;
  camera.flyTo({
    destination: Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height),
    orientation: {
      heading: 0,
      pitch: camera.pitch,
      roll: 0
    },
    duration: 0.9
  });
  requestSceneRender();
}

function updateCompass() {
  if (!state.viewer) return;
  const heading = normalizeDegrees(Cesium.Math.toDegrees(state.viewer.camera.heading));
  const target = -heading;
  const previous = state.compassRotationDeg;
  const next = previous == null ? target : previous + shortestDegreeDelta(previous, target);
  const moved = previous != null && Math.abs(shortestDegreeDelta(previous, target)) > 0.08;
  state.compassRotationDeg = next;
  els.compassDial.style.transform = `rotate(${next}deg)`;
  els.compassButton.classList.toggle("isNorth", Math.abs(shortestDegreeDelta(0, heading)) < 1.2);
  if (moved) {
    els.compassButton.classList.add("isMoving");
    window.clearTimeout(state.compassMovingTimer);
    state.compassMovingTimer = window.setTimeout(() => {
      els.compassButton.classList.remove("isMoving");
    }, 520);
  }
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function shortestDegreeDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

function hierarchyFromPolygon(polygon) {
  const rings = polygon.filter((ring) => ring.length >= 3);
  const holes = rings.slice(1).map((ring) => new Cesium.PolygonHierarchy(positionsFromLine(ring)));
  return new Cesium.PolygonHierarchy(positionsFromLine(rings[0] || []), holes);
}

function hierarchyFromPolygonOffset(polygon, zOffset) {
  const rings = polygon.filter((ring) => ring.length >= 3);
  const holes = rings.slice(1).map((ring) => new Cesium.PolygonHierarchy(positionsFromLineOffset(ring, zOffset)));
  return new Cesium.PolygonHierarchy(positionsFromLineOffset(rings[0] || [], zOffset), holes);
}

function polygonGeometryFromPolygon(polygon, zOffset = 0) {
  const rings = polygonRings(polygon);
  if (!rings.length) return null;
  return new Cesium.PolygonGeometry({
    polygonHierarchy: hierarchyFromPolygonOffset(polygon, zOffset),
    perPositionHeight: true,
    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
  });
}

function polygonRings(polygon) {
  return (polygon || []).filter((ring) => Array.isArray(ring) && ring.length >= 3);
}

function polygonProjectedBbox(polygon) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of polygonRings(polygon)) {
    for (const point of ring) {
      const x = Number(point?.[0]);
      const y = Number(point?.[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return Number.isFinite(minX) ? [minX, minY, maxX, maxY] : null;
}

function bboxContainsBbox(container, inner, tolerance = 0) {
  if (!container || !inner) return false;
  return inner[0] >= container[0] - tolerance
    && inner[1] >= container[1] - tolerance
    && inner[2] <= container[2] + tolerance
    && inner[3] <= container[3] + tolerance;
}

function polygonRepresentativePoint(polygon) {
  const outer = polygonRings(polygon)[0] || [];
  const points = outer.filter((point, index) => {
    if (!Array.isArray(point) || !Number.isFinite(Number(point[0])) || !Number.isFinite(Number(point[1]))) return false;
    if (index !== outer.length - 1) return true;
    const first = outer[0];
    return !first || point[0] !== first[0] || point[1] !== first[1];
  });
  if (!points.length) return null;
  const centroid = points.reduce((sum, point) => [sum[0] + Number(point[0]), sum[1] + Number(point[1])], [0, 0]);
  centroid[0] /= points.length;
  centroid[1] /= points.length;
  return pointInProjectedPolygon(centroid, polygon) ? centroid : [Number(points[0][0]), Number(points[0][1])];
}

function pointInProjectedPolygon(point, polygon) {
  const rings = polygonRings(polygon);
  if (!rings.length || !pointInProjectedRing(point, rings[0])) return false;
  for (const ring of rings.slice(1)) {
    if (pointInProjectedRing(point, ring)) return false;
  }
  return true;
}

function pointInProjectedRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = Number(ring[i]?.[0]);
    const yi = Number(ring[i]?.[1]);
    const xj = Number(ring[j]?.[0]);
    const yj = Number(ring[j]?.[1]);
    if (![xi, yi, xj, yj].every(Number.isFinite)) continue;
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi || 1e-12) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function positionsFromLine(line) {
  const flat = [];
  for (const point of line) flat.push(point[0], point[1], point[2] || 0);
  return Cesium.Cartesian3.fromDegreesArrayHeights(flat);
}

function positionsFromLineOffset(line, zOffset) {
  const flat = [];
  for (const point of line) flat.push(point[0], point[1], (point[2] || 0) + zOffset);
  return Cesium.Cartesian3.fromDegreesArrayHeights(flat);
}

function updateUrl() {
  if (!state.activeCity || state.routeApplying) return;
  const params = new URLSearchParams();
  if (!SINGLE_CITY_MODE) params.set("city", state.activeCity.slug);
  if (state.debugMode) params.set("debug", state.debugMode);
  if (state.selectedFeature) params.set("quarter", state.selectedFeature.id);
  if (!SINGLE_CITY_MODE && state.comparisonMode !== "city") params.set("cmp", state.comparisonMode);
  if (state.theme === "dark") params.set("theme", "dark");
  const blocks = [...state.activeBlocks];
  if (!sameSet(blocks, DEFAULT_BLOCK_KEYS)) params.set("blocks", blocks.length ? blocks.join(",") : "none");
  const layers = [...state.visibleLayers];
  if (!sameSet(layers, DEFAULT_LAYER_KEYS)) params.set("layers", layers.length ? layers.join(",") : "none");
  const query = params.toString();
  history.replaceState({}, "", query ? `${location.pathname}?${query}` : location.pathname);
}

function sameSet(values, defaults) {
  return values.length === defaults.length && defaults.every((key) => values.includes(key));
}

function normalizeComparison(value) {
  return value === "all" ? "all" : "city";
}

function normalizeDebugMode(value) {
  const mode = String(value || "").toLowerCase();
  return ["buildings", "no-polygons", "no-green", "tile-bounds"].includes(mode) ? mode : null;
}

function applyDebugLayerDefaults() {
  if (state.debugMode === "buildings") {
    state.visibleLayers = new Set(["buildings"]);
    return;
  }
  if (state.debugMode === "no-polygons") {
    state.visibleLayers.delete("quartals");
    state.visibleLayers.delete("trees");
  }
}

function debugSkipsLayer(key) {
  if (state.debugMode === "buildings") return key !== "buildings";
  if (state.debugMode === "no-polygons") return key === "quartals" || key === "trees";
  return false;
}

function debugSkipsBaseLayer(key) {
  if (state.debugMode === "buildings") return true;
  if (state.debugMode === "no-polygons") return key === "green" || key === "water";
  if (state.debugMode === "no-green") return key === "green";
  return false;
}

function normalizeKeySet(value, defaults, allowed) {
  if (!value) return new Set(defaults);
  if (value === "none") return new Set();
  const allowedSet = new Set(allowed);
  return new Set(value.split(",").filter((key) => allowedSet.has(key)));
}

function isMobileViewport() {
  return matchMedia("(max-width: 760px)").matches;
}

function disableMobileTrees() {
  if (!isMobileViewport()) return;
  const changed = state.visibleLayers.delete("trees");
  if (changed && state.viewer) clearEntities("trees");
}

const LOADING_STAGES = [
  { key: "layers", label: "Загружаю слои" },
  { key: "terrain", label: "Загружаю рельеф" },
  { key: "buildings", label: "Загружаю здания" },
  { key: "prepare", label: "Готовлю 3D" }
];

function showLoadingOverlay(cityName) {
  els.loadingOverlay.innerHTML = `
    <div class="loadingCard" role="status" aria-live="polite">
      <div class="loadingTitle">${escapeHtml(cityName)}</div>
      <div class="loadingSteps">
        ${LOADING_STAGES.map((stage) => `
          <div class="loadingStep" data-stage="${stage.key}">
            <span></span>
            <strong>${stage.label}</strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  els.loadingOverlay.classList.remove("hidden");
}

function setLoadingStage(key, status = "active") {
  if (!els.loadingOverlay || els.loadingOverlay.classList.contains("hidden")) return;
  for (const node of els.loadingOverlay.querySelectorAll(".loadingStep")) {
    const stage = node.dataset.stage;
    node.classList.toggle("active", stage === key && status === "active");
    if (stage === key && status === "done") node.classList.add("done");
    if (stage === key && status === "error") node.classList.add("error");
  }
}

function showLoading(text) {
  els.loadingOverlay.innerHTML = `<span></span><strong>${escapeHtml(text)}</strong>`;
  els.loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  els.loadingOverlay.classList.add("hidden");
}

function showStatus(text) {
  els.loadingOverlay.innerHTML = `<strong>${escapeHtml(text)}</strong>`;
  els.loadingOverlay.classList.remove("hidden");
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(hideLoading, 2200);
}

function showPointToast(text) {
  if (!els.pointToast) return;
  els.pointToast.textContent = text;
  els.pointToast.classList.remove("hidden");
  window.clearTimeout(showPointToast.timer);
  showPointToast.timer = window.setTimeout(() => {
    els.pointToast.classList.add("hidden");
  }, 2200);
}

function themeColor(key) {
  const palette = mapThemePalette();
  return palette[key];
}

function scoreColor(score, alpha = 1) {
  const stops = brandScoreStops([
    [0, [168, 61, 75]],
    [35, [217, 120, 66]],
    [55, [223, 189, 84]],
    [72, [118, 173, 112]],
    [100, [45, 123, 120]]
  ]);
  const value = Math.max(0, Math.min(100, Number(score) || 0));
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

function accidentPixelSize(item) {
  if (item.items) {
    const severity = item.properties?.severity ?? item.items.length;
    return clamp(7 + Math.sqrt(item.items.length) * 3.2 + Math.sqrt(Math.max(severity, 1)) * 0.55, 10, 25) * 2;
  }
  const props = item.properties || {};
  const severity = props.severity != null ? props.severity : props.injured != null ? props.injured : 1;
  return clamp(2.8 + Math.sqrt(Math.max(severity, 1)) * 2.2, 3.5, 13) * 2;
}

async function fetchJson(url) {
  const response = await fetch(versionedDataUrl(url), { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${url}: ${response.status}`);
  return response.json();
}

function versionedDataUrl(url) {
  if (/^(https?:)?\/\//.test(url)) return url;
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}v=${DATA_CACHE_BUSTER}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function smoothStep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function percentWidth(value) {
  return Math.max(0, Math.min(100, Number(value || 0) * 100));
}

function formatPercent(value) {
  return `${formatNumber(Number(value || 0) * 100, 1)}%`;
}

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

function formatInt(value) {
  if (!Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
