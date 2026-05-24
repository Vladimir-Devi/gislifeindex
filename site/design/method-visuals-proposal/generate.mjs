import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WIDTH = 420;
const HEIGHT = 180;

const THEMES = {
  light: {
    label: "светлая тема",
    bg: "#fffdf8",
    bg2: "#f4f1eb",
    panel: "#fffaf1",
    panel2: "#f6efe2",
    ink: "#202326",
    muted: "#697074",
    line: "#d8d2c7",
    lineSoft: "#e7dfd1",
    shadow: "#202326"
  },
  dark: {
    label: "тёмная тема",
    bg: "#171d20",
    bg2: "#0d1113",
    panel: "#1c2427",
    panel2: "#263135",
    ink: "#edf1ed",
    muted: "#9aa6a8",
    line: "#334044",
    lineSoft: "#2a363a",
    shadow: "#000000"
  }
};

const COLORS = {
  housing: { light: "#256d72", dark: "#54a7a5" },
  infra: { light: "#6f6c2d", dark: "#c8c05f" },
  transport: { light: "#316a9c", dark: "#6b9cc7" },
  work: { light: "#7b5796", dark: "#b292ca" },
  green: { light: "#477f5b", dark: "#6ca879" },
  commerce: { light: "#b88624", dark: "#d4ac55" },
  red: { light: "#b64c3f", dark: "#d46b61" }
};

const FONT = "Inter, Segoe UI, Arial, sans-serif";

const ASSETS = [
  { file: "metric-scenario", title: "Сценарный индекс", color: "housing", draw: drawScenario },
  { file: "metric-base", title: "Основной индекс", color: "commerce", draw: drawBaseIndex },
  { file: "metric-rank", title: "Ранг", color: "work", draw: drawRank },
  { file: "metric-population", title: "Численность населения", color: "green", draw: drawPopulation },
  { file: "block-housing", title: "Жильё", color: "housing", draw: drawBlockHousing },
  { file: "block-infra", title: "Коммерческая инфраструктура", color: "infra", draw: drawBlockInfra },
  { file: "block-transport", title: "Транспорт", color: "transport", draw: drawBlockTransport },
  { file: "block-work", title: "Крупные работодатели", color: "work", draw: drawBlockWork },
  { file: "block-green", title: "Зелёные зоны", color: "green", draw: drawBlockGreen },
  { file: "block-commerce", title: "Экономика", color: "commerce", draw: drawBlockCommerce },
  { file: "indicator-generic", title: "Показатель", color: "housing", draw: drawGenericIndicator },
  { file: "indicator-housing-density", title: "Плотность", color: "housing", draw: drawHousingDensity },
  { file: "indicator-housing-supply", title: "Обеспеченность жильём", color: "housing", draw: drawHousingSupply },
  { file: "indicator-housing-wear", title: "Износ", color: "housing", draw: drawHousingWear },
  { file: "indicator-housing-floors", title: "Этажность", color: "housing", draw: drawHousingFloors },
  { file: "indicator-infra-diversity", title: "Разнообразие", color: "infra", draw: drawInfraDiversity },
  { file: "indicator-infra-basket", title: "Полнота корзины", color: "infra", draw: drawInfraBasket },
  { file: "indicator-transport-access", title: "Доступность остановок", color: "transport", draw: drawTransportAccess },
  { file: "indicator-work-access", title: "Обеспеченность работодателями", color: "work", draw: drawWorkAccess },
  { file: "indicator-work-density", title: "Плотность работодателей", color: "work", draw: drawWorkDensity },
  { file: "indicator-green-access", title: "Доступность зелёных зон", color: "green", draw: drawGreenAccess },
  { file: "indicator-commerce-activity", title: "Активность ФНС", color: "commerce", draw: drawCommerceActivity },
  { file: "indicator-commerce-registers", title: "ККТ", color: "commerce", draw: drawCommerceRegisters },
  { file: "indicator-commerce-check", title: "Медианный чек", color: "commerce", draw: drawCommerceCheck }
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((part) => Math.round(part).toString(16).padStart(2, "0")).join("")}`;
}

function mix(a, b, amount = 0.5) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex({
    r: ca.r * (1 - amount) + cb.r * amount,
    g: ca.g * (1 - amount) + cb.g * amount,
    b: ca.b * (1 - amount) + cb.b * amount
  });
}

function accent(themeName, colorKey) {
  return COLORS[colorKey][themeName] || COLORS.housing[themeName];
}

function svg({ themeName, asset }) {
  const theme = THEMES[themeName];
  const color = accent(themeName, asset.color);
  const titleId = `${asset.file}-${themeName}-title`;
  const descId = `${asset.file}-${themeName}-desc`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420pt" height="180pt" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="${titleId} ${descId}">
  <title id="${titleId}">${esc(asset.title)}, ${theme.label}</title>
  <desc id="${descId}">Редактируемая SVG-иллюстрация 420×180 pt для методической карточки сайта индекса качества городской среды.</desc>
  <g id="background">
    ${background(theme, color)}
  </g>
  <g id="caption">
    ${caption(asset.title, theme, color)}
  </g>
  <g id="illustration">
    ${asset.draw(theme, color, themeName)}
  </g>
</svg>
`;
}

function background(t, color) {
  return `
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="8" fill="${t.bg}"/>
    <path d="M0 138 C72 112 136 158 213 126 C286 94 338 110 420 82 L420 180 L0 180 Z" fill="${color}" opacity="0.08"/>
    <path d="M24 137 C82 105 126 149 182 112 C243 72 296 123 354 88 C374 76 390 72 404 75" fill="none" stroke="${color}" stroke-width="2" opacity="0.15"/>
    <g id="map-grid" stroke="${t.line}" stroke-width="1" opacity="0.44">
      ${[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390].map((x) => `<path d="M${x} 16 V164"/>`).join("")}
      ${[30, 60, 90, 120, 150].map((y) => `<path d="M16 ${y} H404"/>`).join("")}
    </g>
    <rect x="18" y="18" width="384" height="144" rx="8" fill="none" stroke="${t.lineSoft}" stroke-width="1"/>
  `;
}

function caption(title, t, color) {
  const lines = splitTitle(title);
  const width = Math.max(...lines.map((line) => line.length)) * 7 + 28;
  const w = Math.min(Math.max(width, 86), 236);
  const h = lines.length > 1 ? 40 : 28;
  const y = 18;
  const textY = lines.length > 1 ? y + 15 : y + 18;
  return `
    <rect x="24" y="${y}" width="${w}" height="${h}" rx="7" fill="${t.panel}" stroke="${color}" stroke-opacity="0.42"/>
    <text x="38" y="${textY}" fill="${t.ink}" font-family="${FONT}" font-size="13" font-weight="700">
      ${lines.map((line, index) => `<tspan x="38" dy="${index === 0 ? 0 : 15}">${esc(line)}</tspan>`).join("")}
    </text>
  `;
}

function splitTitle(title) {
  const manual = {
    "Коммерческая инфраструктура": ["Коммерческая", "инфраструктура"],
    "Численность населения": ["Численность", "населения"],
    "Обеспеченность работодателями": ["Обеспеченность", "работодателями"],
    "Плотность работодателей": ["Плотность", "работодателей"],
    "Доступность зелёных зон": ["Доступность", "зелёных зон"],
    "Доступность остановок": ["Доступность", "остановок"],
    "Обеспеченность жильём": ["Обеспеченность", "жильём"]
  };
  return manual[title] || [title];
}

function label(textValue, x, y, w, t, color, options = {}) {
  const h = options.h || 24;
  const size = options.size || 12;
  const weight = options.weight || 700;
  const fill = options.fill || mix(color, t.panel, 0.88);
  const textColor = options.textColor || t.ink;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${fill}" stroke="${color}" stroke-opacity="0.38"/>
    <text x="${x + w / 2}" y="${y + h / 2 + size * 0.34}" text-anchor="middle" fill="${textColor}" font-family="${FONT}" font-size="${size}" font-weight="${weight}">${esc(textValue)}</text>
  `;
}

function smallText(textValue, x, y, t, options = {}) {
  return `<text x="${x}" y="${y}" fill="${options.color || t.muted}" font-family="${FONT}" font-size="${options.size || 11}" font-weight="${options.weight || 650}"${options.anchor ? ` text-anchor="${options.anchor}"` : ""}>${esc(textValue)}</text>`;
}

function shadow(x, y, w, h, t, opacity = 0.14) {
  return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${t.shadow}" opacity="${opacity}"/>`;
}

function building({ x, y, w, h, floors = 4, t, color, fill }) {
  const gap = h / (floors + 1);
  const windows = Array.from({ length: floors }, (_, index) => {
    const wy = y + 12 + index * gap;
    return `<path d="M${x + 9} ${wy} H${x + w - 9}" stroke="${mix(color, fill, 0.5)}" stroke-width="3" stroke-linecap="round" opacity="0.72"/>`;
  }).join("");
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${fill}" stroke="${color}" stroke-width="2"/>
    ${windows}
    <rect x="${x + w / 2 - 5}" y="${y + h - 18}" width="10" height="18" rx="3" fill="${mix(color, fill, 0.72)}" opacity="0.7"/>
  `;
}

function house({ x, y, w, h, t, color, cracked = false }) {
  const fill = mix(color, t.panel, 0.9);
  const roof = `M${x - 4} ${y + h * 0.38} L${x + w / 2} ${y} L${x + w + 4} ${y + h * 0.38}`;
  return `
    <path d="${roof}" fill="${mix(color, t.panel, 0.75)}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="${x + 5}" y="${y + h * 0.36}" width="${w - 10}" height="${h * 0.58}" rx="7" fill="${fill}" stroke="${color}" stroke-width="2"/>
    <rect x="${x + 18}" y="${y + h * 0.51}" width="18" height="18" rx="3" fill="${t.panel2}" stroke="${color}" stroke-opacity="0.45"/>
    <rect x="${x + w - 38}" y="${y + h * 0.51}" width="18" height="18" rx="3" fill="${t.panel2}" stroke="${color}" stroke-opacity="0.45"/>
    <rect x="${x + w / 2 - 7}" y="${y + h * 0.64}" width="14" height="${h * 0.3}" rx="3" fill="${mix(color, t.panel, 0.72)}" opacity="0.8"/>
    ${cracked ? `<path d="M${x + w * 0.55} ${y + h * 0.43} l-8 16 l10 8 l-9 18" fill="none" stroke="${COLORS.red.light}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
  `;
}

function tree(x, y, scale, t, color) {
  return `
    <path d="M${x} ${y + 18 * scale} V${y + 43 * scale}" stroke="${mix("#704c28", t.bg, 0.1)}" stroke-width="${5 * scale}" stroke-linecap="round"/>
    <circle cx="${x - 12 * scale}" cy="${y + 16 * scale}" r="${14 * scale}" fill="${mix(color, t.panel, 0.22)}" stroke="${color}" stroke-opacity="0.55"/>
    <circle cx="${x + 7 * scale}" cy="${y + 9 * scale}" r="${17 * scale}" fill="${mix(color, t.panel, 0.12)}" stroke="${color}" stroke-opacity="0.55"/>
    <circle cx="${x + 18 * scale}" cy="${y + 23 * scale}" r="${13 * scale}" fill="${mix(color, t.panel, 0.2)}" stroke="${color}" stroke-opacity="0.55"/>
  `;
}

function person(x, y, t, color, scale = 1) {
  return `
    <circle cx="${x}" cy="${y}" r="${4 * scale}" fill="${color}"/>
    <path d="M${x} ${y + 6 * scale} v${12 * scale}" stroke="${color}" stroke-width="${4 * scale}" stroke-linecap="round"/>
    <path d="M${x - 7 * scale} ${y + 12 * scale} h${14 * scale}" stroke="${color}" stroke-width="${3 * scale}" stroke-linecap="round"/>
    <path d="M${x - 5 * scale} ${y + 25 * scale} l${5 * scale} -7 l${5 * scale} 7" fill="none" stroke="${color}" stroke-width="${3 * scale}" stroke-linecap="round"/>
  `;
}

function busStop(x, y, t, color) {
  return `
    <rect x="${x}" y="${y}" width="74" height="54" rx="8" fill="${mix(color, t.panel, 0.88)}" stroke="${color}" stroke-width="2"/>
    <path d="M${x + 12} ${y + 14} H${x + 62} M${x + 18} ${y + 14} V${y + 54} M${x + 56} ${y + 14} V${y + 54}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <rect x="${x + 24}" y="${y + 24}" width="26" height="13" rx="3" fill="${t.panel}" stroke="${color}" stroke-opacity="0.45"/>
    <text x="${x + 37}" y="${y + 35}" text-anchor="middle" fill="${color}" font-family="${FONT}" font-size="10" font-weight="800">ОТ</text>
  `;
}

function cashRegister(x, y, t, color, scale = 1) {
  const s = scale;
  return `
    <path d="M${x + 18 * s} ${y} H${x + 43 * s} L${x + 51 * s} ${y + 20 * s} H${x + 25 * s} Z" fill="${mix(color, t.panel, 0.82)}" stroke="${color}" stroke-width="${2 * s}" stroke-linejoin="round"/>
    <rect x="${x + 5 * s}" y="${y + 18 * s}" width="${54 * s}" height="${20 * s}" rx="${5 * s}" fill="${mix(color, t.panel, 0.9)}" stroke="${color}" stroke-width="${2 * s}"/>
    <rect x="${x}" y="${y + 36 * s}" width="${68 * s}" height="${46 * s}" rx="${8 * s}" fill="${t.panel}" stroke="${color}" stroke-width="${2 * s}"/>
    <rect x="${x + 11 * s}" y="${y + 47 * s}" width="${40 * s}" height="${15 * s}" rx="${4 * s}" fill="${mix(color, t.panel, 0.82)}" stroke="${color}" stroke-opacity="0.45"/>
    <path d="M${x + 13 * s} ${y + 72 * s} H${x + 55 * s} M${x + 17 * s} ${y + 66 * s} h3 M${x + 28 * s} ${y + 66 * s} h3 M${x + 39 * s} ${y + 66 * s} h3" stroke="${color}" stroke-width="${3 * s}" stroke-linecap="round" opacity="0.75"/>
  `;
}

function storefront(x, y, w, h, t, color, textValue) {
  return `
    <rect x="${x}" y="${y + 18}" width="${w}" height="${h - 18}" rx="7" fill="${t.panel}" stroke="${color}" stroke-width="2"/>
    <path d="M${x} ${y + 18} h${w} l-8 -18 h${-w + 16} Z" fill="${mix(color, t.panel, 0.76)}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M${x + 10} ${y + 33} H${x + w - 10}" stroke="${mix(color, t.panel, 0.44)}" stroke-width="4" stroke-linecap="round"/>
    <text x="${x + w / 2}" y="${y + h - 12}" text-anchor="middle" fill="${color}" font-family="${FONT}" font-size="10" font-weight="800">${esc(textValue)}</text>
  `;
}

function office(x, y, w, h, floors, t, color) {
  const fill = mix(color, t.panel, 0.9);
  const rows = Array.from({ length: floors }, (_, row) => {
    const yy = y + 11 + row * ((h - 24) / Math.max(1, floors - 1));
    return `<path d="M${x + 10} ${yy} H${x + w - 10}" stroke="${mix(color, fill, 0.48)}" stroke-width="3" stroke-linecap="round" opacity="0.72"/>`;
  }).join("");
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${color}" stroke-width="2"/>
    ${rows}
    <rect x="${x + w / 2 - 7}" y="${y + h - 18}" width="14" height="18" rx="3" fill="${mix(color, t.panel, 0.66)}" opacity="0.85"/>
  `;
}

function drawScenario(t, color, themeName) {
  const blockKeys = ["housing", "infra", "transport", "work", "green", "commerce"];
  const chips = blockKeys.map((key, index) => {
    const c = accent(themeName, key);
    const x = 52 + index * 47;
    const active = index !== 3;
    return `
      <rect x="${x}" y="${active ? 92 : 99}" width="32" height="${active ? 32 : 18}" rx="7" fill="${active ? mix(c, t.panel, 0.28) : t.panel2}" stroke="${c}" stroke-width="2" opacity="${active ? 1 : 0.58}"/>
      <path d="M${x + 9} ${active ? 108 : 108} h14" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity="${active ? 0.9 : 0.58}"/>
    `;
  }).join("");
  return `
    ${shadow(55, 137, 290, 18, t, 0.14)}
    <path d="M60 134 C105 103 151 146 197 110 C248 72 302 104 356 76" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="356" cy="76" r="9" fill="${color}"/>
    ${chips}
    ${label("включены блоки", 54, 55, 130, t, color)}
    ${label("пересчёт", 244, 48, 92, t, color)}
    <path d="M188 67 C214 66 226 56 242 55" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="6 6"/>
    <rect x="244" y="82" width="92" height="58" rx="10" fill="${t.panel}" stroke="${color}" stroke-width="2"/>
    <path d="M260 118 A30 30 0 0 1 321 118" fill="none" stroke="${mix(color, t.panel, 0.42)}" stroke-width="8" stroke-linecap="round"/>
    <path d="M260 118 A30 30 0 0 1 305 92" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
    <text x="290" y="126" text-anchor="middle" fill="${t.ink}" font-family="${FONT}" font-size="14" font-weight="800">индекс</text>
  `;
}

function drawBaseIndex(t, color, themeName) {
  const keys = ["housing", "infra", "transport", "work", "green", "commerce"];
  const bars = keys.map((key, index) => {
    const c = accent(themeName, key);
    const x = 55 + index * 37;
    const h = [46, 35, 58, 30, 42, 52][index];
    return `<rect x="${x}" y="${132 - h}" width="24" height="${h}" rx="6" fill="${mix(c, t.panel, 0.28)}" stroke="${c}" stroke-width="2"/>`;
  }).join("");
  return `
    ${shadow(50, 138, 255, 18, t, 0.14)}
    ${bars}
    <path d="M48 134 H294" stroke="${t.line}" stroke-width="2" stroke-linecap="round"/>
    <path d="M90 68 C139 42 194 42 244 70" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <path d="M240 58 L252 73 L232 75" fill="${t.panel}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="294" y="59" width="78" height="78" rx="13" fill="${t.panel}" stroke="${color}" stroke-width="2"/>
    <text x="333" y="91" text-anchor="middle" fill="${color}" font-family="${FONT}" font-size="24" font-weight="800">Σ</text>
    <text x="333" y="118" text-anchor="middle" fill="${t.ink}" font-family="${FONT}" font-size="13" font-weight="800">индекс</text>
    ${label("все направления", 88, 45, 132, t, color)}
  `;
}

function drawRank(t, color) {
  return `
    ${shadow(58, 139, 250, 18, t, 0.14)}
    <rect x="74" y="103" width="54" height="34" rx="7" fill="${mix(color, t.panel, 0.82)}" stroke="${color}" stroke-width="2"/>
    <rect x="140" y="80" width="60" height="57" rx="7" fill="${mix(color, t.panel, 0.68)}" stroke="${color}" stroke-width="2"/>
    <rect x="212" y="115" width="52" height="22" rx="7" fill="${mix(color, t.panel, 0.88)}" stroke="${color}" stroke-width="2"/>
    <text x="101" y="126" text-anchor="middle" fill="${t.ink}" font-family="${FONT}" font-size="18" font-weight="800">2</text>
    <text x="170" y="114" text-anchor="middle" fill="${t.ink}" font-family="${FONT}" font-size="24" font-weight="800">1</text>
    <text x="238" y="132" text-anchor="middle" fill="${t.ink}" font-family="${FONT}" font-size="15" font-weight="800">3</text>
    <rect x="288" y="60" width="82" height="78" rx="10" fill="${t.panel}" stroke="${color}" stroke-width="2"/>
    ${["место", "7", "из 900"].map((line, index) => `<text x="329" y="${82 + index * 22}" text-anchor="middle" fill="${index === 1 ? color : t.ink}" font-family="${FONT}" font-size="${index === 1 ? 26 : 12}" font-weight="800">${line}</text>`).join("")}
    ${label("рейтинг", 70, 55, 86, t, color)}
  `;
}

function drawPopulation(t, color) {
  const dots = [
    [92, 95], [112, 78], [133, 100], [155, 83], [175, 107], [104, 123], [145, 128], [188, 84], [205, 114]
  ].map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="${index % 3 === 0 ? 6 : 5}" fill="${color}" opacity="${index % 2 ? 0.72 : 0.95}"/>`).join("");
  return `
    <path d="M62 72 L174 46 L235 89 L195 140 L78 134 Z" fill="${mix(color, t.panel, 0.88)}" stroke="${color}" stroke-width="2"/>
    ${dots}
    <path d="M245 129 C268 111 288 111 309 129 C326 111 347 104 367 116" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    ${person(282, 75, t, color, 1.12)}
    ${person(326, 82, t, mix(color, t.panel, 0.25), 0.94)}
    ${label("жители", 66, 50, 78, t, color)}
    ${label("квартал", 246, 47, 86, t, color)}
  `;
}

function drawBlockHousing(t, color) {
  return `
    ${shadow(58, 141, 260, 18, t, 0.14)}
    <path d="M53 130 C47 88 63 56 96 39 C124 25 157 34 179 62 C205 59 232 79 237 109 C185 123 122 148 53 130 Z" fill="${mix(color, t.panel, 0.85)}" stroke="${color}" stroke-opacity="0.48" stroke-width="2"/>
    ${building({ x: 70, y: 62, w: 42, h: 70, floors: 4, t, color, fill: t.panel })}
    ${building({ x: 126, y: 45, w: 52, h: 87, floors: 5, t, color, fill: t.panel })}
    ${building({ x: 194, y: 75, w: 38, h: 57, floors: 3, t, color, fill: t.panel })}
    ${label("м²/чел", 265, 63, 70, t, color)}
    ${label("этажность", 267, 98, 94, t, color)}
    <path d="M262 137 H370" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
  `;
}

function drawBlockInfra(t, color) {
  return `
    ${shadow(58, 141, 290, 18, t, 0.14)}
    ${storefront(62, 75, 70, 60, t, color, "еда")}
    ${storefront(149, 60, 72, 75, t, color, "услуги")}
    ${storefront(239, 82, 68, 53, t, color, "аптека")}
    <path d="M333 86 h34 l-6 43 h-23 z" fill="${t.panel}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M341 86 c1 -18 19 -18 20 0" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    ${label("разные функции", 70, 47, 132, t, color)}
    ${label("корзина", 303, 50, 76, t, color)}
  `;
}

function drawBlockTransport(t, color) {
  return `
    <path d="M56 126 C110 79 166 147 222 99 C276 52 333 87 376 64" fill="none" stroke="${mix(color, t.panel, 0.46)}" stroke-width="28" stroke-linecap="round" opacity="0.62"/>
    <path d="M56 126 C110 79 166 147 222 99 C276 52 333 87 376 64" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    ${busStop(153, 71, t, color)}
    ${label("5 мин", 64, 69, 64, t, color)}
    ${label("остановка", 250, 51, 96, t, color)}
    <circle cx="89" cy="125" r="8" fill="${t.panel}" stroke="${color}" stroke-width="3"/>
    <circle cx="351" cy="66" r="8" fill="${t.panel}" stroke="${color}" stroke-width="3"/>
  `;
}

function drawBlockWork(t, color) {
  return `
    ${shadow(62, 141, 284, 18, t, 0.14)}
    ${office(70, 69, 54, 66, 4, t, color)}
    ${office(139, 46, 66, 89, 6, t, color)}
    <path d="M223 135 V83 h70 v52" fill="${mix(color, t.panel, 0.88)}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M223 83 l36 -25 l34 25" fill="${mix(color, t.panel, 0.76)}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M237 101 H280 M237 116 H280" stroke="${mix(color, t.panel, 0.42)}" stroke-width="4" stroke-linecap="round"/>
    ${label("работа", 309, 62, 74, t, color)}
    ${label("крупные организации", 237, 37, 144, t, color)}
  `;
}

function drawBlockGreen(t, color) {
  return `
    <path d="M52 132 C91 89 128 141 176 110 C229 75 291 78 367 125" fill="none" stroke="${mix(color, t.panel, 0.45)}" stroke-width="24" stroke-linecap="round" opacity="0.7"/>
    <path d="M52 132 C91 89 128 141 176 110 C229 75 291 78 367 125" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="7 8" stroke-linecap="round"/>
    ${tree(103, 72, 1.12, t, color)}
    ${tree(192, 52, 1.3, t, color)}
    ${tree(292, 77, 1.0, t, color)}
    ${label("парк", 65, 52, 62, t, color)}
    ${label("5 мин пешком", 252, 48, 112, t, color)}
  `;
}

function drawBlockCommerce(t, color) {
  return `
    ${shadow(55, 141, 300, 18, t, 0.14)}
    ${storefront(65, 72, 82, 63, t, color, "точка")}
    ${cashRegister(178, 57, t, color, 0.92)}
    <rect x="297" y="65" width="62" height="76" rx="7" fill="${t.panel}" stroke="${color}" stroke-width="2"/>
    <path d="M309 83 H347 M309 99 H346 M309 115 H336" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.65"/>
    <text x="328" y="136" text-anchor="middle" fill="${color}" font-family="${FONT}" font-size="14" font-weight="800">₽</text>
    ${label("ФНС", 72, 47, 58, t, color)}
    ${label("ККТ", 196, 39, 58, t, color)}
    ${label("чек", 303, 41, 58, t, color)}
  `;
}

function drawGenericIndicator(t, color) {
  return `
    <path d="M75 70 L194 48 L251 92 L202 138 L84 128 Z" fill="${mix(color, t.panel, 0.9)}" stroke="${color}" stroke-width="2"/>
    <path d="M90 96 L130 86 L170 104 L217 78" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="248" cy="83" r="30" fill="none" stroke="${color}" stroke-width="6"/>
    <path d="M270 106 L315 139" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
    ${label("данные", 69, 47, 74, t, color)}
    ${label("оценка", 280, 52, 76, t, color)}
  `;
}

function drawHousingDensity(t, color) {
  const people = [[82, 90], [105, 76], [128, 98], [151, 82], [174, 105], [103, 122], [142, 128], [196, 88], [218, 111], [232, 78]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${color}"/>`).join("");
  return `
    <path d="M58 72 L171 48 L248 83 L221 139 L78 132 Z" fill="${mix(color, t.panel, 0.9)}" stroke="${color}" stroke-width="2"/>
    ${people}
    <path d="M280 132 V74 M305 132 V93 M330 132 V61 M355 132 V101" stroke="${color}" stroke-width="15" stroke-linecap="round" opacity="0.78"/>
    ${label("чел/га", 277, 46, 70, t, color)}
    ${smallText("больше точек на той же площади", 64, 151, t)}
  `;
}

function drawHousingSupply(t, color) {
  return `
    <rect x="66" y="58" width="144" height="82" rx="9" fill="${t.panel}" stroke="${color}" stroke-width="2"/>
    <path d="M66 96 H210 M132 58 V140 M132 96 H168 M168 96 V140" stroke="${color}" stroke-width="2" opacity="0.75"/>
    <path d="M72 149 H204 M72 144 v10 M204 144 v10" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M253 138 V72 H349 V138" fill="${mix(color, t.panel, 0.88)}" stroke="${color}" stroke-width="2"/>
    ${person(302, 95, t, color, 1.05)}
    ${label("м²/чел", 105, 38, 76, t, color)}
    ${label("жилая площадь", 242, 43, 122, t, color)}
  `;
}

function drawHousingWear(t, color) {
  return `
    ${shadow(78, 140, 250, 17, t, 0.14)}
    ${house({ x: 78, y: 52, w: 104, h: 90, t, color, cracked: true })}
    <path d="M215 134 C236 104 267 103 287 133 C306 113 330 106 354 118" fill="none" stroke="${mix(color, t.panel, 0.45)}" stroke-width="12" stroke-linecap="round" opacity="0.7"/>
    <path d="M219 132 C241 105 267 104 287 132" fill="none" stroke="${COLORS.red.light}" stroke-width="4" stroke-linecap="round"/>
    ${label("износ", 220, 62, 68, t, COLORS.red[Object.keys(THEMES).find((key) => THEMES[key] === t) || "light"] || COLORS.red.light)}
    ${label("требует внимания", 248, 96, 132, t, color)}
  `;
}

function drawHousingFloors(t, color) {
  return `
    ${shadow(62, 141, 260, 18, t, 0.14)}
    ${building({ x: 68, y: 82, w: 42, h: 54, floors: 3, t, color, fill: t.panel })}
    ${building({ x: 126, y: 62, w: 48, h: 74, floors: 4, t, color, fill: t.panel })}
    ${building({ x: 193, y: 42, w: 56, h: 94, floors: 6, t, color, fill: t.panel })}
    <path d="M284 45 V136" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    ${[50, 70, 90, 110, 130].map((y) => `<path d="M284 ${y} h18" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`).join("")}
    ${label("этажей", 306, 68, 72, t, color)}
    ${label("средняя высота", 285, 104, 120, t, color)}
  `;
}

function drawInfraDiversity(t, color) {
  const items = [
    [64, 77, "еда"],
    [145, 58, "услуги"],
    [226, 82, "аптека"],
    [307, 65, "спорт"]
  ];
  return `
    ${shadow(58, 141, 300, 18, t, 0.14)}
    ${items.map(([x, y, textValue]) => storefront(x, y, 62, 58, t, color, textValue)).join("")}
    <path d="M95 59 C151 37 220 38 296 58" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 7"/>
    ${label("разные типы", 153, 36, 104, t, color)}
  `;
}

function drawInfraBasket(t, color) {
  return `
    <path d="M83 76 h112 l-16 62 H99 Z" fill="${t.panel}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M106 76 c2 -32 60 -32 63 0" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="117" cy="101" r="9" fill="${mix(color, t.panel, 0.35)}" stroke="${color}"/>
    <rect x="137" y="92" width="22" height="26" rx="5" fill="${mix(color, t.panel, 0.78)}" stroke="${color}"/>
    <path d="M168 99 l10 12 l14 -24" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="240" y="61" width="102" height="80" rx="10" fill="${t.panel}" stroke="${color}" stroke-width="2"/>
    ${["магазин", "аптека", "услуги"].map((line, index) => `<path d="M255 ${83 + index * 19} l7 7 l13 -15" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="285" y="${87 + index * 19}" fill="${t.ink}" font-family="${FONT}" font-size="12" font-weight="700">${line}</text>`).join("")}
    ${label("полная корзина", 83, 43, 126, t, color)}
  `;
}

function drawTransportAccess(t, color) {
  return `
    <path d="M64 125 C105 89 153 140 196 101 C249 54 304 74 365 100" fill="none" stroke="${mix(color, t.panel, 0.45)}" stroke-width="28" stroke-linecap="round" opacity="0.68"/>
    <path d="M64 125 C105 89 153 140 196 101 C249 54 304 74 365 100" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    ${busStop(172, 70, t, color)}
    <circle cx="85" cy="123" r="8" fill="${t.panel}" stroke="${color}" stroke-width="3"/>
    <circle cx="344" cy="98" r="8" fill="${t.panel}" stroke="${color}" stroke-width="3"/>
    ${label("5 мин", 76, 62, 64, t, color)}
    ${label("зона доступности", 255, 48, 132, t, color)}
  `;
}

function drawWorkAccess(t, color) {
  return `
    ${house({ x: 64, y: 72, w: 72, h: 62, t, color })}
    ${office(260, 58, 70, 78, 5, t, color)}
    <path d="M153 103 C188 78 221 76 252 99" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 7"/>
    <path d="M242 87 L255 100 L237 105" fill="${t.panel}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    ${label("дом", 74, 51, 58, t, color)}
    ${label("работа рядом", 226, 42, 116, t, color)}
    ${smallText("связь жилого квартала с занятостью", 93, 153, t)}
  `;
}

function drawWorkDensity(t, color) {
  const offices = [
    [66, 84, 39, 52, 3],
    [116, 66, 46, 70, 4],
    [177, 49, 54, 87, 6],
    [247, 76, 42, 60, 4]
  ];
  const points = [[326, 82], [346, 66], [362, 98], [333, 118], [374, 123], [312, 105]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${color}" opacity="0.78"/>`).join("");
  return `
    ${shadow(58, 141, 260, 18, t, 0.14)}
    ${offices.map(([x, y, w, h, floors]) => office(x, y, w, h, floors, t, color)).join("")}
    <path d="M306 58 L382 75 L371 139 L306 127 Z" fill="${mix(color, t.panel, 0.9)}" stroke="${color}" stroke-width="2"/>
    ${points}
    ${label("ед./м²", 306, 42, 72, t, color)}
  `;
}

function drawGreenAccess(t, color) {
  return `
    <path d="M60 126 C102 91 145 136 191 105 C240 72 289 86 359 124" fill="none" stroke="${mix(color, t.panel, 0.45)}" stroke-width="25" stroke-linecap="round" opacity="0.74"/>
    <path d="M60 126 C102 91 145 136 191 105 C240 72 289 86 359 124" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="7 8" stroke-linecap="round"/>
    ${tree(111, 68, 1.1, t, color)}
    ${tree(220, 55, 1.32, t, color)}
    ${tree(310, 82, 0.98, t, color)}
    ${label("зелень рядом", 69, 47, 112, t, color)}
    ${label("5 мин", 288, 53, 64, t, color)}
  `;
}

function drawCommerceActivity(t, color) {
  return `
    ${shadow(60, 141, 290, 18, t, 0.14)}
    ${storefront(62, 81, 66, 54, t, color, "ИП")}
    ${storefront(154, 62, 72, 73, t, color, "ООО")}
    ${storefront(250, 90, 64, 45, t, color, "услуги")}
    <path d="M84 59 C137 38 211 41 281 65" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="282" cy="65" r="8" fill="${color}"/>
    ${label("активность ФНС", 119, 39, 132, t, color)}
    ${label("операции", 302, 52, 82, t, color)}
  `;
}

function drawCommerceRegisters(t, color) {
  return `
    ${shadow(58, 141, 300, 18, t, 0.14)}
    ${cashRegister(62, 62, t, color, 0.86)}
    ${cashRegister(168, 44, t, color, 0.92)}
    ${cashRegister(281, 66, t, color, 0.82)}
    <path d="M92 139 C154 116 220 149 302 119 C326 110 345 104 365 92" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    ${label("кассовая техника", 138, 39, 136, t, color)}
    ${label("ККТ", 302, 43, 58, t, color)}
  `;
}

function drawCommerceCheck(t, color) {
  return `
    <rect x="80" y="50" width="105" height="92" rx="7" fill="${t.panel}" stroke="${color}" stroke-width="2"/>
    <path d="M80 50 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l15 -8" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M100 79 H164 M100 97 H156 M100 116 H146" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity="0.66"/>
    <text x="136" y="136" text-anchor="middle" fill="${color}" font-family="${FONT}" font-size="20" font-weight="800">₽</text>
    <path d="M238 132 V101 M268 132 V82 M298 132 V63 M328 132 V95" stroke="${color}" stroke-width="17" stroke-linecap="round" opacity="0.78"/>
    <path d="M225 132 H352" stroke="${t.line}" stroke-width="2" stroke-linecap="round"/>
    ${label("типичная покупка", 78, 30, 132, t, color)}
    ${label("медиана", 255, 42, 82, t, color)}
  `;
}

async function writeAssets() {
  for (const themeName of Object.keys(THEMES)) {
    await mkdir(join(ROOT, themeName), { recursive: true });
  }

  for (const asset of ASSETS) {
    for (const themeName of Object.keys(THEMES)) {
      await writeFile(join(ROOT, themeName, `${asset.file}.svg`), svg({ themeName, asset }), "utf8");
    }
  }

  await writeFile(join(ROOT, "manifest.json"), `${JSON.stringify(ASSETS.map(({ file, title, color }) => ({ file, title, color })), null, 2)}\n`, "utf8");
  await writeFile(join(ROOT, "preview.html"), previewHtml(), "utf8");
  await writeFile(join(ROOT, "README.md"), readme(), "utf8");
}

function previewHtml() {
  const cards = ASSETS.map((asset) => `
      <article>
        <h2>${esc(asset.title)}</h2>
        <div class="pair">
          <img src="light/${asset.file}.svg" alt="${esc(asset.title)} — светлая тема" width="420" height="180">
          <img src="dark/${asset.file}.svg" alt="${esc(asset.title)} — тёмная тема" width="420" height="180">
        </div>
        <code>${asset.file}.svg</code>
      </article>`).join("");
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Предложение SVG-иллюстраций методических карточек</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, "Segoe UI", Arial, sans-serif; background: #f4f1eb; color: #202326; }
    body { margin: 0; padding: 28px; }
    h1 { margin: 0 0 20px; font-size: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 18px; }
    article { display: grid; gap: 10px; padding: 14px; border: 1px solid #d8d2c7; border-radius: 8px; background: #fffdf8; }
    h2 { margin: 0; font-size: 16px; }
    .pair { display: grid; gap: 10px; }
    img { display: block; width: 100%; max-width: 420px; height: auto; border: 1px solid #d8d2c7; border-radius: 8px; }
    code { color: #697074; font-size: 12px; }
    @media (min-width: 980px) { .pair { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (prefers-color-scheme: dark) {
      :root { background: #0d1113; color: #edf1ed; }
      article { background: #171d20; border-color: #334044; }
      img { border-color: #334044; }
      code { color: #9aa6a8; }
    }
  </style>
</head>
<body>
  <h1>SVG-иллюстрации для методических карточек</h1>
  <main class="grid">${cards}
  </main>
</body>
</html>
`;
}

function readme() {
  const rows = ASSETS.map((asset) => `- \`${asset.file}.svg\` — ${asset.title}`).join("\n");
  return `# Предложение SVG-иллюстраций методических карточек

Это отдельный дизайн-комплект. Он не подключён к сайту и не лежит в \`site/public\`, поэтому не попадёт в публикацию сам по себе.

Размер каждого SVG: \`420pt × 180pt\`, \`viewBox="0 0 420 180"\`.

Файлы сделаны простыми векторными объектами: \`rect\`, \`path\`, \`circle\`, \`text\`, без внешних ресурсов и CSS-переменных. Текст оставлен редактируемым для Adobe Illustrator.

## Состав

${rows}

## Проверка

Откройте \`preview.html\`, чтобы посмотреть светлую и тёмную версии рядом.
`;
}

await writeAssets();
