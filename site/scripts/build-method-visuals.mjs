import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(siteDir, "public", "method-visuals");

const themeTokens = {
  light: {
    bgA: "#fffdf8",
    bgB: "#f4f1eb",
    panel: "#fffaf1",
    ink: "#202326",
    muted: "#697074",
    line: "#d8d2c7",
    lineSoft: "rgba(65, 66, 66, 0.16)",
    grid: "rgba(104, 99, 88, 0.13)",
    shadowColor: "#1f2326",
    shadowOpacity: 0.12,
    wash: 0.13,
    fill: 0.16
  },
  dark: {
    bgA: "#171d20",
    bgB: "#0d1113",
    panel: "#1c2427",
    ink: "#edf1ed",
    muted: "#9aa6a8",
    line: "#334044",
    lineSoft: "rgba(226, 232, 222, 0.14)",
    grid: "rgba(226, 232, 222, 0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0.34,
    wash: 0.19,
    fill: 0.22
  }
};

const accentTokens = {
  housing: { light: "#256d72", dark: "#54a7a5" },
  infra: { light: "#6f6c2d", dark: "#b8b56a" },
  transport: { light: "#316a9c", dark: "#6b9cc7" },
  work: { light: "#7b5796", dark: "#b28ad0" },
  green: { light: "#477f5b", dark: "#6ca879" },
  commerce: { light: "#b88624", dark: "#d4ac55" },
  rank: { light: "#7b5796", dark: "#b28ad0" },
  base: { light: "#b88624", dark: "#d4ac55" },
  population: { light: "#477f5b", dark: "#6ca879" }
};

const assets = [
  { id: "metric-scenario", title: "Сценарный индекс", accent: "housing", draw: drawScenario },
  { id: "metric-base", title: "Основной индекс", accent: "base", draw: drawBaseIndex },
  { id: "metric-rank", title: "Ранг территории", accent: "rank", draw: drawRank },
  { id: "metric-population", title: "Численность населения", accent: "population", draw: drawPopulation },
  { id: "block-housing", title: "Субиндекс жилья", accent: "housing", draw: drawHousing },
  { id: "block-infra", title: "Субиндекс коммерческой инфраструктуры", accent: "infra", draw: drawInfra },
  { id: "block-transport", title: "Субиндекс транспорта", accent: "transport", draw: drawTransport },
  { id: "block-work", title: "Субиндекс крупных работодателей", accent: "work", draw: drawWork },
  { id: "block-green", title: "Субиндекс зеленых зон", accent: "green", draw: drawGreen },
  { id: "block-commerce", title: "Субиндекс экономики", accent: "commerce", draw: drawCommerce },
  { id: "indicator-housing-density", title: "Показатель плотности населения", accent: "housing", draw: drawHousingDensity },
  { id: "indicator-housing-supply", title: "Показатель обеспеченности жильем", accent: "housing", draw: drawHousingSupply },
  { id: "indicator-housing-wear", title: "Показатель износа жилья", accent: "housing", draw: drawHousingWear },
  { id: "indicator-housing-floors", title: "Показатель этажности", accent: "housing", draw: drawHousingFloors },
  { id: "indicator-infra-diversity", title: "Показатель разнообразия инфраструктуры", accent: "infra", draw: drawInfraDiversity },
  { id: "indicator-infra-basket", title: "Показатель полноты городской корзины", accent: "infra", draw: drawInfraBasket },
  { id: "indicator-transport-access", title: "Показатель доступности остановок", accent: "transport", draw: drawTransportAccess },
  { id: "indicator-work-access", title: "Показатель обеспеченности работодателями", accent: "work", draw: drawWorkAccess },
  { id: "indicator-work-density", title: "Показатель плотности работодателей", accent: "work", draw: drawWorkDensity },
  { id: "indicator-green-access", title: "Показатель доступности зеленых зон", accent: "green", draw: drawGreenAccess },
  { id: "indicator-commerce-activity", title: "Показатель активности ФНС", accent: "commerce", draw: drawCommerceActivity },
  { id: "indicator-commerce-registers", title: "Показатель ККТ", accent: "commerce", draw: drawCommerceRegisters },
  { id: "indicator-commerce-check", title: "Показатель медианного чека", accent: "commerce", draw: drawCommerceCheck },
  { id: "indicator-generic", title: "Показатель", accent: "housing", draw: drawGenericIndicator }
];

function assertOutputPath(target) {
  const resolved = path.resolve(target);
  const expected = path.join(siteDir, "public", "method-visuals");
  if (resolved !== expected) {
    throw new Error(`Refusing to write method visuals outside the expected directory: ${resolved}`);
  }
}

function renderSvg(asset, themeName) {
  const t = themeTokens[themeName];
  const accent = accentTokens[asset.accent][themeName];
  const allAccents = Object.fromEntries(
    Object.entries(accentTokens).map(([key, value]) => [key, value[themeName]])
  );
  const body = asset.draw(t, accent, allAccents);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="420pt" height="180pt" viewBox="0 0 420 180" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(asset.title)}, ${themeName === "dark" ? "темная" : "светлая"} тема</title>
  <desc id="desc">Лаконичная иллюстрация для методической карточки сайта индекса качества городской среды.</desc>
  <defs>
    <linearGradient id="cardBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.bgA}"/>
      <stop offset="1" stop-color="${t.bgB}"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="${t.shadowColor}" flood-opacity="${t.shadowOpacity}"/>
    </filter>
  </defs>
  ${background(t, accent)}
  ${body}
</svg>
`;
}

function background(t, accent) {
  return `
  <rect width="420" height="180" rx="8" fill="url(#cardBg)"/>
  <g stroke="${t.grid}" stroke-width="1">
    ${range(30, 390, 30).map((x) => `<path d="M${x} 14V166"/>`).join("")}
    ${range(30, 150, 30).map((y) => `<path d="M14 ${y}H406"/>`).join("")}
  </g>
  <path d="M18 126C72 92 112 150 164 111C217 72 263 126 318 89C348 69 374 72 402 87" fill="none" stroke="${accent}" stroke-width="2" opacity="${t.wash}"/>
  <path d="M0 151C86 129 154 162 231 130C297 103 351 114 420 95V180H0Z" fill="${accent}" opacity="${t.fill * 0.42}"/>
  <rect x="18" y="18" width="384" height="144" rx="8" fill="none" stroke="${t.lineSoft}"/>
`;
}

function drawScenario(t, accent, a) {
  const chips = [
    [34, 31, a.housing],
    [126, 31, a.infra],
    [34, 70, a.transport],
    [126, 70, a.work],
    [34, 109, a.green],
    [126, 109, a.commerce]
  ];
  return `
  <g filter="url(#softShadow)">
    ${chips.map(([x, y, color], index) => `<rect x="${x}" y="${y}" width="68" height="24" rx="7" fill="${mix(t.panel, color, 0.16)}" stroke="${color}" stroke-opacity=".52"/>
    <circle cx="${x + 14}" cy="${y + 12}" r="5" fill="${color}" opacity="${index % 2 ? ".78" : ".9"}"/>`).join("")}
    <path d="M207 91H287" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <path d="M281 80L295 91L281 102" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="344" cy="91" r="38" fill="${t.panel}" stroke="${accent}" stroke-width="2"/>
    <path d="M323 91A21 21 0 0 1 365 91A21 21 0 0 1 323 91Z" fill="${mix(t.panel, accent, 0.25)}"/>
    <path d="M344 63V119M316 91H372" stroke="${accent}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  </g>`;
}

function drawBaseIndex(t, accent, a) {
  const colors = [a.housing, a.infra, a.transport, a.work, a.green, a.commerce];
  return `
  <g filter="url(#softShadow)">
    ${colors.map((color, i) => `<rect x="${42 + i * 28}" y="${108 - i % 3 * 11}" width="84" height="38" rx="8" fill="${mix(t.panel, color, 0.14)}" stroke="${color}" stroke-opacity=".48" transform="rotate(${-7 + i * 2} ${84 + i * 28} 127)"/>`).join("")}
    <circle cx="292" cy="88" r="50" fill="${t.panel}" stroke="${accent}" stroke-width="2"/>
    ${colors.map((color, i) => arcSegment(292, 88, 38, i * 60 + 4, i * 60 + 48, color, 8)).join("")}
    <circle cx="292" cy="88" r="17" fill="${mix(t.panel, accent, 0.18)}" stroke="${accent}" stroke-width="2"/>
  </g>`;
}

function drawRank(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <path d="M50 130H190" stroke="${t.line}" stroke-width="2"/>
    <rect x="62" y="82" width="38" height="48" rx="6" fill="${mix(t.panel, accent, 0.12)}" stroke="${accent}" stroke-opacity=".55"/>
    <rect x="108" y="57" width="46" height="73" rx="6" fill="${mix(t.panel, accent, 0.24)}" stroke="${accent}"/>
    <rect x="162" y="96" width="36" height="34" rx="6" fill="${mix(t.panel, accent, 0.1)}" stroke="${accent}" stroke-opacity=".48"/>
    <text x="81" y="112" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="${t.ink}" opacity=".78">2</text>
    <text x="131" y="101" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="800" fill="${t.ink}">1</text>
    <text x="180" y="118" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="${t.ink}" opacity=".68">3</text>
    <path d="M238 116C266 78 299 103 324 66C342 39 361 47 378 34" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    ${[238, 272, 308, 342, 378].map((x, i) => `<circle cx="${x}" cy="${[116, 91, 88, 52, 34][i]}" r="7" fill="${t.panel}" stroke="${accent}" stroke-width="3"/>`).join("")}
  </g>`;
}

function drawPopulation(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${quarter(40, 34, 150, 100, t.panel, accent, 0.36)}
    ${dots(66, 55, 5, 4, 16, accent, [0, 1, 2, 4, 5, 7, 8, 10, 13, 15, 16, 18])}
    <rect x="238" y="43" width="46" height="64" rx="6" fill="${mix(t.panel, accent, 0.12)}" stroke="${accent}" stroke-opacity=".48"/>
    <rect x="294" y="28" width="52" height="79" rx="6" fill="${mix(t.panel, accent, 0.18)}" stroke="${accent}" stroke-opacity=".6"/>
    <rect x="356" y="66" width="32" height="41" rx="6" fill="${mix(t.panel, accent, 0.1)}" stroke="${accent}" stroke-opacity=".42"/>
    <path d="M226 131H393" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".65"/>
    ${dots(250, 121, 8, 1, 18, accent, [0, 1, 2, 3, 4, 5, 6, 7])}
  </g>`;
}

function drawHousing(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${districtBase(t, accent)}
    ${building(69, 58, 42, 74, 4, t, accent)}
    ${building(124, 42, 50, 90, 5, t, accent)}
    ${building(187, 70, 36, 62, 3, t, accent)}
    <path d="M259 131C281 112 310 112 333 130C351 111 374 105 392 115" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="300" cy="88" r="22" fill="${mix(t.panel, accent, 0.16)}" stroke="${accent}" stroke-opacity=".55"/>
    <path d="M300 73V103M288 91H312" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function drawInfra(t, accent) {
  const services = [
    [74, 57, colorForTheme("#b64c3f", t), "shop"],
    [140, 57, colorForTheme("#316a9c", t), "health"],
    [74, 94, colorForTheme("#477f5b", t), "food"],
    [140, 94, colorForTheme("#7b5796", t), "service"],
    [107, 127, accent, "cart"]
  ];
  return `
  <g filter="url(#softShadow)">
    ${quarter(39, 32, 174, 112, t.panel, accent, 0.28)}
    ${services.map(([x, y, color, kind]) => serviceIcon(x, y, color, t, kind)).join("")}
    <path d="M244 56H374V132H244Z" fill="${t.panel}" stroke="${accent}" stroke-width="2"/>
    <path d="M258 56L271 35H347L360 56" fill="${mix(t.panel, accent, 0.16)}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M244 70H374" stroke="${accent}" stroke-width="2" opacity=".52"/>
    <path d="M258 92H282M296 92H320M334 92H359M258 114H292M307 114H359" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".68"/>
    <rect x="268" y="117" width="23" height="15" rx="3" fill="${mix(t.panel, accent, 0.18)}" stroke="${accent}" stroke-opacity=".48"/>
  </g>`;
}

function drawTransport(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <path d="M40 120C96 69 137 103 190 62C239 24 296 55 379 35" fill="none" stroke="${mix(t.panel, accent, 0.18)}" stroke-width="22" stroke-linecap="round"/>
    <path d="M40 120C96 69 137 103 190 62C239 24 296 55 379 35" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
    ${[[69, 98], [139, 96], [204, 55], [285, 49], [356, 40]].map(([x, y]) => stopMarker(x, y, t, accent)).join("")}
    <path d="M74 137H154M228 132H328" stroke="${t.line}" stroke-width="2" stroke-linecap="round"/>
    ${walkingDots(76, 130, accent)}
    ${walkingDots(247, 125, accent)}
  </g>`;
}

function drawWork(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${building(251, 35, 62, 98, 6, t, accent)}
    ${building(325, 58, 42, 75, 4, t, accent)}
    <path d="M59 130H165L112 76Z" fill="${mix(t.panel, accent, 0.12)}" stroke="${accent}" stroke-width="2"/>
    <rect x="76" y="103" width="72" height="31" rx="5" fill="${t.panel}" stroke="${accent}" stroke-opacity=".55"/>
    <path d="M150 111C188 88 212 82 253 84" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 12"/>
    <circle cx="112" cy="76" r="8" fill="${accent}"/>
    <circle cx="283" cy="35" r="8" fill="${accent}"/>
  </g>`;
}

function drawGreen(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <path d="M45 118C53 65 112 37 165 55C201 24 266 32 290 79C336 78 378 104 382 140C294 132 215 154 133 137C99 130 73 126 45 118Z" fill="${mix(t.panel, accent, 0.26)}" stroke="${accent}" stroke-width="2"/>
    <path d="M75 122C123 104 166 112 205 88C236 69 259 74 286 87C319 103 339 99 369 129" fill="none" stroke="${t.panel}" stroke-width="9" stroke-linecap="round" opacity=".82"/>
    <path d="M75 122C123 104 166 112 205 88C236 69 259 74 286 87C319 103 339 99 369 129" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 9" opacity=".72"/>
    ${tree(112, 82, t, accent)}
    ${tree(173, 93, t, accent)}
    ${tree(255, 70, t, accent)}
    ${tree(314, 104, t, accent)}
  </g>`;
}

function drawCommerce(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <rect x="49" y="54" width="126" height="74" rx="8" fill="${t.panel}" stroke="${accent}" stroke-width="2"/>
    <path d="M63 54L75 35H149L162 54" fill="${mix(t.panel, accent, 0.18)}" stroke="${accent}" stroke-width="2"/>
    <path d="M77 87H145M77 106H126" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity=".72"/>
    <rect x="235" y="41" width="118" height="88" rx="8" fill="${mix(t.panel, accent, 0.12)}" stroke="${accent}" stroke-opacity=".55"/>
    ${barChart(255, 108, [33, 56, 43, 70], accent, t)}
    <path d="M221 139H371" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".65"/>
  </g>`;
}

function drawHousingDensity(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${quarter(46, 31, 170, 116, t.panel, accent, 0.22)}
    ${dots(70, 55, 6, 5, 17, accent, range(0, 29, 1))}
    <path d="M254 132V57" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${276 + i * 20}" y="${122 - i * 15}" width="13" height="${10 + i * 15}" rx="4" fill="${mix(t.panel, accent, 0.16 + i * 0.025)}" stroke="${accent}" stroke-opacity=".5"/>`).join("")}
  </g>`;
}

function drawHousingSupply(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <rect x="56" y="52" width="96" height="80" rx="8" fill="${t.panel}" stroke="${accent}" stroke-width="2"/>
    <path d="M47 58L104 25L162 58" fill="${mix(t.panel, accent, 0.14)}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="86" y="91" width="34" height="41" rx="5" fill="${mix(t.panel, accent, 0.16)}" stroke="${accent}" stroke-opacity=".55"/>
    <path d="M222 122H367M222 122V57" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <path d="M245 102H348M245 82H318M245 62H291" stroke="${t.line}" stroke-width="2" stroke-linecap="round"/>
    <path d="M226 122C257 88 302 104 334 67" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

function drawHousingWear(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${building(70, 39, 72, 95, 5, t, accent)}
    <path d="M105 45L93 72L113 88L96 124" fill="none" stroke="${colorForTheme("#b64c3f", t)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M209 122C235 94 273 112 295 78C318 43 350 48 372 33" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <path d="M217 72H370" stroke="${t.line}" stroke-width="2" stroke-linecap="round"/>
    <path d="M217 102H338" stroke="${t.line}" stroke-width="2" stroke-linecap="round"/>
  </g>`;
}

function drawHousingFloors(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${60 + i * 24}" y="${118 - i * 18}" width="78" height="22" rx="5" fill="${mix(t.panel, accent, 0.1 + i * 0.035)}" stroke="${accent}" stroke-opacity=".52"/>`).join("")}
    ${building(249, 33, 61, 101, 7, t, accent)}
    <path d="M331 123V49" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <path d="M320 60L331 49L342 60M320 112L331 123L342 112" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function drawInfraDiversity(t, accent) {
  const services = [
    [66, 51, colorForTheme("#b64c3f", t), "shop"],
    [132, 51, colorForTheme("#316a9c", t), "health"],
    [198, 51, colorForTheme("#477f5b", t), "food"],
    [66, 109, colorForTheme("#7b5796", t), "service"],
    [132, 109, colorForTheme("#b88624", t), "cart"],
    [198, 109, colorForTheme("#256d72", t), "bank"]
  ];
  return `
  <g filter="url(#softShadow)">
    ${services.map(([x, y, color, kind]) => serviceIcon(x, y, color, t, kind)).join("")}
    <path d="M268 132H363M268 104H389M268 76H342M268 48H377" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity=".65"/>
    <circle cx="242" cy="48" r="7" fill="${accent}"/><circle cx="242" cy="76" r="7" fill="${accent}" opacity=".82"/><circle cx="242" cy="104" r="7" fill="${accent}" opacity=".7"/><circle cx="242" cy="132" r="7" fill="${accent}" opacity=".58"/>
  </g>`;
}

function drawInfraBasket(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <path d="M58 68H191L176 130H75Z" fill="${t.panel}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M91 68C96 38 152 38 158 68" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    ${[[90, 91], [122, 91], [154, 91], [104, 114], [140, 114]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="8" fill="${mix(t.panel, accent, 0.2 + i * 0.03)}" stroke="${accent}" stroke-opacity=".55"/>`).join("")}
    <rect x="252" y="43" width="108" height="90" rx="8" fill="${mix(t.panel, accent, 0.1)}" stroke="${accent}" stroke-opacity=".55"/>
    ${[61, 84, 107].map((y) => `<path d="M272 ${y}H340" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity=".65"/>`).join("")}
    ${[61, 84, 107].map((y) => `<path d="M256 ${y - 2}L263 ${y + 5}L273 ${y - 7}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}
  </g>`;
}

function drawTransportAccess(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <circle cx="143" cy="88" r="62" fill="${mix(t.panel, accent, 0.1)}" stroke="${accent}" stroke-dasharray="5 8" stroke-width="2"/>
    ${stopMarker(143, 88, t, accent)}
    <path d="M69 126C95 108 115 120 143 101C171 82 197 88 226 63" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    ${walkingDots(81, 120, accent)}
    <path d="M258 128H371M258 93H344M258 59H390" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity=".56"/>
    <path d="M248 128V59" stroke="${t.line}" stroke-width="2" stroke-linecap="round"/>
  </g>`;
}

function drawWorkAccess(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <path d="M64 131H149L108 90Z" fill="${t.panel}" stroke="${accent}" stroke-width="2"/>
    <rect x="82" y="111" width="52" height="21" rx="4" fill="${mix(t.panel, accent, 0.13)}" stroke="${accent}" stroke-opacity=".48"/>
    ${building(304, 48, 48, 83, 5, t, accent)}
    <path d="M148 112C193 72 239 104 305 75" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 13"/>
    <circle cx="108" cy="90" r="8" fill="${accent}"/><circle cx="328" cy="48" r="8" fill="${accent}"/>
  </g>`;
}

function drawWorkDensity(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${quarter(45, 31, 179, 116, t.panel, accent, 0.22)}
    ${dots(72, 55, 6, 4, 19, accent, [0, 1, 2, 3, 5, 6, 7, 9, 10, 12, 13, 16, 17, 18, 20, 22])}
    ${employerMarker(89, 72, t, accent)}${employerMarker(164, 91, t, accent)}${employerMarker(126, 123, t, accent)}
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${265 + i * 21}" y="${126 - [22, 45, 35, 63, 50][i]}" width="14" height="${[22, 45, 35, 63, 50][i]}" rx="4" fill="${mix(t.panel, accent, 0.15)}" stroke="${accent}" stroke-opacity=".54"/>`).join("")}
    <path d="M254 127H379" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function drawGreenAccess(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <path d="M56 116C58 69 109 44 152 61C176 39 225 43 244 78C281 76 316 97 320 129C246 121 185 139 119 127C92 122 74 120 56 116Z" fill="${mix(t.panel, accent, 0.25)}" stroke="${accent}" stroke-width="2"/>
    <circle cx="262" cy="94" r="51" fill="${mix(t.panel, accent, 0.08)}" stroke="${accent}" stroke-dasharray="5 8" stroke-width="2"/>
    <path d="M141 105C185 86 220 103 262 94" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    ${tree(113, 86, t, accent)}${tree(184, 80, t, accent)}${walkingDots(253, 112, accent)}
  </g>`;
}

function drawCommerceActivity(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${quarter(46, 38, 155, 100, t.panel, accent, 0.2)}
    <path d="M67 107C89 79 113 96 133 68C151 43 172 52 188 39" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    ${[[67, 107], [104, 88], [133, 68], [165, 51], [188, 39]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${t.panel}" stroke="${accent}" stroke-width="3"/>`).join("")}
    <path d="M226 43H284V128L275 122L266 128L257 122L248 128L239 122L226 127Z" fill="${t.panel}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M242 64H270M242 84H267M242 104H274" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity=".58"/>
    <path d="M303 126V44" stroke="${t.line}" stroke-width="2" stroke-linecap="round"/>
    <path d="M315 124H377M315 97H349M315 70H388M315 43H353" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity=".58"/>
  </g>`;
}

function drawCommerceRegisters(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${cashRegister(58, 67, t, accent)}
    ${cashRegister(151, 48, t, accent)}
    ${cashRegister(244, 67, t, accent)}
    <path d="M64 139C142 118 214 150 303 119C326 111 344 104 363 92" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="363" cy="92" r="8" fill="${accent}"/>
    <path d="M347 88L362 92L351 103" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function drawCommerceCheck(t, accent) {
  return `
  <g filter="url(#softShadow)">
    <path d="M75 34H178V135L164 126L150 135L136 126L122 135L108 126L94 135L75 126Z" fill="${t.panel}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
    ${[58, 78, 98, 118].map((y, i) => `<path d="M95 ${y}H${i === 1 ? 153 : 164}" stroke="${accent}" stroke-width="${i === 2 ? 6 : 4}" stroke-linecap="round" opacity="${i === 2 ? ".82" : ".48"}"/>`).join("")}
    <path d="M237 127H376" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
    ${barChart(251, 109, [31, 42, 71, 45, 36], accent, t)}
    <path d="M246 74H370" stroke="${colorForTheme("#b64c3f", t)}" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 8"/>
  </g>`;
}

function drawGenericIndicator(t, accent) {
  return `
  <g filter="url(#softShadow)">
    ${quarter(54, 37, 148, 98, t.panel, accent, 0.22)}
    <path d="M242 126H366M242 95H337M242 64H384" stroke="${accent}" stroke-width="6" stroke-linecap="round" opacity=".62"/>
    <circle cx="185" cy="79" r="20" fill="${mix(t.panel, accent, 0.16)}" stroke="${accent}" stroke-width="2"/>
    <path d="M185 60V98M166 79H204" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function districtBase(t, accent) {
  return `
  <path d="M51 129C46 91 58 57 91 39C122 22 160 38 180 66C206 63 231 81 234 110C182 124 118 150 51 129Z" fill="${mix(t.panel, accent, 0.12)}" stroke="${accent}" stroke-opacity=".46" stroke-width="2"/>`;
}

function quarter(x, y, w, h, panel, accent, alpha) {
  return `<path d="M${x + 8} ${y + 33}C${x + 24} ${y + 2} ${x + 74} ${y - 4} ${x + 99} ${y + 19}C${x + 121} ${y + 6} ${x + w - 2} ${y + 22} ${x + w - 10} ${y + 61}C${x + w - 17} ${y + h - 8} ${x + 72} ${y + h + 4} ${x + 24} ${y + h - 12}C${x + 6} ${y + h - 18} ${x - 3} ${y + 64} ${x + 8} ${y + 33}Z" fill="${mix(panel, accent, alpha)}" stroke="${accent}" stroke-opacity=".58" stroke-width="2"/>`;
}

function building(x, y, w, h, floors, t, accent) {
  const rows = range(0, floors - 1, 1);
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${t.panel}" stroke="${accent}" stroke-width="2"/>
  ${rows.map((row) => `<path d="M${x + 9} ${y + 13 + row * ((h - 24) / Math.max(1, floors - 1))}H${x + w - 9}" stroke="${mix(t.panel, accent, 0.48)}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`).join("")}`;
}

function dots(x, y, cols, rows, gap, fill, active) {
  const activeSet = new Set(active);
  const items = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      if (!activeSet.has(index)) continue;
      items.push(`<circle cx="${x + col * gap}" cy="${y + row * gap}" r="5" fill="${fill}" opacity="${0.48 + ((index % 5) * 0.1)}"/>`);
    }
  }
  return items.join("");
}

function iconNode(x, y, color, t) {
  return `<g>
    <circle cx="${x}" cy="${y}" r="17" fill="${mix(t.panel, color, 0.18)}" stroke="${color}" stroke-width="2"/>
    <path d="M${x - 8} ${y}H${x + 8}M${x} ${y - 8}V${y + 8}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity=".78"/>
  </g>`;
}

function serviceIcon(x, y, color, t, kind) {
  const body = {
    shop: `<path d="M${x - 8} ${y - 1}H${x + 8}M${x - 6} ${y - 1}V${y + 8}H${x + 6}V${y - 1}M${x - 4} ${y - 1}C${x - 3} ${y - 9} ${x + 3} ${y - 9} ${x + 4} ${y - 1}" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
    cart: `<path d="M${x - 10} ${y - 7}H${x - 6}L${x - 2} ${y + 5}H${x + 9}M${x - 3} ${y - 2}H${x + 8}M${x - 1} ${y + 10}h.1M${x + 7} ${y + 10}h.1" fill="none" stroke="${color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
    food: `<path d="M${x - 7} ${y - 9}V${y + 9}M${x - 11} ${y - 9}V${y - 3}C${x - 11} ${y + 1} ${x - 7} ${y + 1} ${x - 7} ${y - 3}M${x - 3} ${y - 9}V${y - 3}C${x - 3} ${y + 1} ${x - 7} ${y + 1} ${x - 7} ${y - 3}M${x + 7} ${y - 8}C${x + 12} ${y - 4} ${x + 12} ${y + 2} ${x + 7} ${y + 5}V${y + 9}" fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`,
    health: `<path d="M${x - 8} ${y}H${x + 8}M${x} ${y - 8}V${y + 8}" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>`,
    service: `<path d="M${x - 8} ${y + 8}L${x + 7} ${y - 7}M${x + 3} ${y - 10}L${x + 10} ${y - 3}M${x - 10} ${y + 4}L${x - 4} ${y + 10}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    bank: `<path d="M${x - 10} ${y - 4}H${x + 10}L${x} ${y - 11}Z M${x - 8} ${y + 8}H${x + 8}M${x - 6} ${y - 3}V${y + 7}M${x} ${y - 3}V${y + 7}M${x + 6} ${y - 3}V${y + 7}" fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`
  }[kind] || `<path d="M${x - 8} ${y}H${x + 8}M${x} ${y - 8}V${y + 8}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  return `<g>
    <circle cx="${x}" cy="${y}" r="17" fill="${mix(t.panel, color, 0.18)}" stroke="${color}" stroke-width="2"/>
    ${body}
  </g>`;
}

function employerMarker(x, y, t, accent) {
  return `<g>
    <circle cx="${x}" cy="${y}" r="15" fill="${mix(t.panel, accent, 0.24)}" stroke="${accent}" stroke-width="2"/>
    <path d="M${x - 8} ${y - 1}H${x + 8}V${y + 8}H${x - 8}ZM${x - 4} ${y - 1}V${y - 6}H${x + 4}V${y - 1}" fill="${t.panel}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
  </g>`;
}

function cashRegister(x, y, t, accent) {
  return `<g>
    <path d="M${x + 19} ${y - 20}H${x + 43}L${x + 50} ${y}" fill="${mix(t.panel, accent, 0.12)}" stroke="${accent}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="${x + 12}" y="${y - 14}" width="35" height="18" rx="4" fill="${mix(t.panel, accent, 0.18)}" stroke="${accent}" stroke-opacity=".52"/>
    <rect x="${x}" y="${y}" width="66" height="54" rx="8" fill="${t.panel}" stroke="${accent}" stroke-width="2"/>
    <rect x="${x + 10}" y="${y + 12}" width="42" height="17" rx="4" fill="${mix(t.panel, accent, 0.2)}" stroke="${accent}" stroke-opacity=".45"/>
    <path d="M${x + 12} ${y + 40}H${x + 54}M${x + 18} ${y + 34}H${x + 21}M${x + 28} ${y + 34}H${x + 31}M${x + 38} ${y + 34}H${x + 41}" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".72"/>
  </g>`;
}

function stopMarker(x, y, t, accent) {
  return `<g>
    <circle cx="${x}" cy="${y}" r="14" fill="${t.panel}" stroke="${accent}" stroke-width="3"/>
    <path d="M${x - 5} ${y + 7}V${y - 5}H${x + 5}V${y + 7}" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linejoin="round"/>
  </g>`;
}

function walkingDots(x, y, accent) {
  return `<circle cx="${x}" cy="${y}" r="4" fill="${accent}" opacity=".48"/>
  <circle cx="${x + 16}" cy="${y - 5}" r="4" fill="${accent}" opacity=".6"/>
  <circle cx="${x + 31}" cy="${y - 1}" r="4" fill="${accent}" opacity=".76"/>`;
}

function tree(x, y, t, accent) {
  return `<g>
    <path d="M${x} ${y + 17}V${y + 33}" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${x}" cy="${y}" r="17" fill="${mix(t.panel, accent, 0.42)}" stroke="${accent}" stroke-opacity=".52"/>
    <circle cx="${x - 13}" cy="${y + 9}" r="11" fill="${mix(t.panel, accent, 0.3)}" stroke="${accent}" stroke-opacity=".4"/>
    <circle cx="${x + 12}" cy="${y + 10}" r="10" fill="${mix(t.panel, accent, 0.34)}" stroke="${accent}" stroke-opacity=".38"/>
  </g>`;
}

function barChart(x, baseY, values, accent, t) {
  return values.map((height, i) => `<rect x="${x + i * 20}" y="${baseY - height}" width="12" height="${height}" rx="4" fill="${mix(t.panel, accent, 0.18 + i * 0.035)}" stroke="${accent}" stroke-opacity=".5"/>`).join("");
}

function arcSegment(cx, cy, radius, start, end, color, width) {
  const p1 = polar(cx, cy, radius, start);
  const p2 = polar(cx, cy, radius, end);
  const large = end - start > 180 ? 1 : 0;
  return `<path d="M${p1.x.toFixed(2)} ${p1.y.toFixed(2)}A${radius} ${radius} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function polar(cx, cy, radius, degrees) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function mix(base, color, amount) {
  return colorMix(base, color, amount);
}

function colorForTheme(color, t) {
  if (t === themeTokens.dark) {
    const darkMap = {
      "#256d72": "#54a7a5",
      "#6f6c2d": "#b8b56a",
      "#316a9c": "#6b9cc7",
      "#7b5796": "#b28ad0",
      "#477f5b": "#6ca879",
      "#b88624": "#d4ac55",
      "#b64c3f": "#d46b61"
    };
    return darkMap[color] || color;
  }
  return color;
}

function colorMix(base, color, amount) {
  const a = hexToRgb(base);
  const b = hexToRgb(color);
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * amount)}, ${Math.round(a[1] + (b[1] - a[1]) * amount)}, ${Math.round(a[2] + (b[2] - a[2]) * amount)})`;
}

function hexToRgb(value) {
  const hex = value.replace("#", "");
  return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

function range(start, end, step) {
  const values = [];
  for (let value = start; value <= end; value += step) values.push(value);
  return values;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

assertOutputPath(outputDir);
rmSync(outputDir, { recursive: true, force: true });

for (const themeName of Object.keys(themeTokens)) {
  const themeDir = path.join(outputDir, themeName);
  mkdirSync(themeDir, { recursive: true });
  for (const asset of assets) {
    writeFileSync(path.join(themeDir, `${asset.id}.svg`), renderSvg(asset, themeName), "utf8");
  }
}

console.log(`Created ${assets.length * Object.keys(themeTokens).length} method visual SVG files in ${outputDir}`);
