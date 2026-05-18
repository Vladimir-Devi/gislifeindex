import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(siteDir, "..");
const distDir = path.join(rootDir, "site_dist");
let cachedDataManifest = null;

function assertDistPath(target) {
  const resolved = path.resolve(target);
  if (path.basename(resolved) !== "site_dist" || path.dirname(resolved) !== rootDir) {
    throw new Error(`Refusing to clean unexpected output path: ${resolved}`);
  }
}

function copyDir(source, target, shouldSkip = () => false) {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });

  for (const entry of readdirSync(source)) {
    const sourcePath = path.join(source, entry);
    const targetPath = path.join(target, entry);
    if (shouldSkip(sourcePath)) continue;

    const stat = statSync(sourcePath);
    if (stat.isDirectory()) {
      copyDir(sourcePath, targetPath, shouldSkip);
    } else if (stat.isFile()) {
      cpSync(sourcePath, targetPath);
    }
  }
}

function readDataManifest() {
  const manifestPath = path.join(siteDir, "data3d", "manifest.json");
  if (!existsSync(manifestPath)) return null;

  try {
    cachedDataManifest ??= JSON.parse(readFileSync(manifestPath, "utf8"));
    return cachedDataManifest;
  } catch (error) {
    console.warn(`Unable to read data version from ${manifestPath}:`, error);
    return null;
  }
}

function dataVersionFromManifest() {
  const fallback = Date.now().toString();
  const manifest = readDataManifest();
  if (!manifest) return fallback;

  try {
    const generatedAt = String(manifest.generatedAt || "");
    const version = generatedAt.replace(/\D/g, "").slice(0, 14);
    return version || fallback;
  } catch (error) {
    console.warn("Unable to derive data version from manifest:", error);
    return fallback;
  }
}

function contentHash(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
}

function formatInt(value) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function renderQualityStructure(city) {
  const low = clamp((city.lowShare || 0) * 100, 0, 100);
  const mid = clamp((city.midShare || 0) * 100, 0, 100);
  const high = clamp((city.highShare || 0) * 100, 0, 100);
  return `
            <div class="qualityMix" aria-label="Структура населения по качеству среды">
              <div class="qualityTitle">Структура населения по качеству среды:</div>
              <div class="qualityBar"><span class="qualityBad" style="width:${low}%"></span><span class="qualityMid" style="width:${mid}%"></span><span class="qualityGood" style="width:${high}%"></span></div>
              <div class="qualityLegend"><span><i class="qualityDot bad"></i>Плохая ${formatNumber(low, 1)}%</span><span><i class="qualityDot mid"></i>Средняя ${formatNumber(mid, 1)}%</span><span><i class="qualityDot good"></i>Хорошая ${formatNumber(high, 1)}%</span></div>
            </div>`;
}

function renderStaticCityMenu() {
  const manifest = readDataManifest();
  if (!manifest?.cities?.length) return null;
  const cards = manifest.cities
    .map((city) => {
      const name = escapeHtml(city.name);
      const slug = escapeHtml(city.slug);
      return `          <article class="cityCard pkmn-card pkmn-card--rare" data-city="${slug}">
            <div class="cityCardTop">
              <h2 class="cityName">${name}</h2>
              <div class="cityRating"><strong>${formatNumber(city.index, 2)}</strong><span>место ${formatInt(city.rank)}</span></div>
            </div>
            <div class="crestSlot"><img src="public/herb_${slug}.png" alt="Герб ${name}" loading="lazy"></div>
            <dl class="cityFacts">
              <div><dt>Жители</dt><dd>${formatInt(city.population)}</dd></div>
              <div><dt>Кварталы</dt><dd>${formatInt(city.stats?.quartals)}</dd></div>
            </dl>${renderQualityStructure(city)}
          </article>`;
    })
    .join("\n");
  return `        <section class="cityMenu" id="cityMenu">\n${cards}\n        </section>`;
}

function updateStaticCityMenu(filePath) {
  const menu = renderStaticCityMenu();
  if (!menu) return;
  const html = readFileSync(filePath, "utf8");
  const updated = html.replace(
    /        <section class="cityMenu" id="cityMenu">[\s\S]*?        <\/section>\s*\n\s*<section class="mapShell/,
    `${menu}\n\n        <section class="mapShell`
  );
  if (updated === html) throw new Error(`Unable to update static city menu in ${path.basename(filePath)}`);
  writeFileSync(filePath, updated, "utf8");
}

function versionStylesheets(filePath) {
  const stylesVersion = contentHash(path.join(distDir, "src", "styles.css"));
  const mapVersion = contentHash(path.join(distDir, "src", "map3d.css"));
  const html = readFileSync(filePath, "utf8");
  const updated = html
    .replace(/href="src\/styles\.css\?v=[^"]+"/, `href="src/styles.css?v=${stylesVersion}"`)
    .replace(/href="src\/map3d\.css\?v=[^"]+"/, `href="src/map3d.css?v=${mapVersion}"`);
  if (updated === html) throw new Error(`Unable to version CSS links in ${path.basename(filePath)}`);
  writeFileSync(filePath, updated, "utf8");
}

function bundleMap3dScript() {
  const sourcePath = path.join(distDir, "src", "map3d.js");
  const source = readFileSync(sourcePath, "utf8");
  const dataVersion = dataVersionFromManifest();
  const versionedSource = source.replace(
    /const DATA_VERSION = "[^"]+";/,
    `const DATA_VERSION = "${dataVersion}";`
  );
  if (versionedSource === source) {
    throw new Error("Unable to replace DATA_VERSION in map3d.js");
  }
  const codeHash = createHash("sha256").update(versionedSource).digest("hex").slice(0, 10);
  const bundleVersion = `${dataVersion}-${codeHash}`;
  const bundlePath = `src/map3d.bundle.js?v=${bundleVersion}`;
  writeFileSync(path.join(distDir, "src", "map3d.bundle.js"), versionedSource, "utf8");

  const loader = `(() => {
  const version = "${bundleVersion}";
  const bundleUrl = "${bundlePath}";
  const maxAttempts = 4;
  const showError = () => {
    const menu = document.getElementById("cityMenu");
    if (menu) menu.innerHTML = '<div class="muted">Не удалось загрузить 3D-модуль. Обновите страницу.</div>';
  };
  const loadScript = (attempt = 0) => {
    let done = false;
    const script = document.createElement("script");
    script.src = bundleUrl + (attempt ? "&retry=" + attempt + "-" + Date.now() : "");
    script.async = true;
    script.dataset.lifeindexBundle = version;
    const retry = () => {
      if (done) return;
      done = true;
      script.remove();
      if (attempt + 1 < maxAttempts) {
        window.setTimeout(() => loadScript(attempt + 1), 350 * (attempt + 1));
      } else {
        showError();
      }
    };
    const timer = window.setTimeout(retry, 45000);
    script.onload = () => {
      done = true;
      window.clearTimeout(timer);
    };
    script.onerror = retry;
    try {
      document.head.appendChild(script);
    } catch (error) {
      console.error(error);
      retry();
    }
  };
  loadScript();
})();
`;
  writeFileSync(sourcePath, loader, "utf8");

  const inlineLoader = `<script>\n${loader.replaceAll("</script", "<\\/script")}</script>`;
  const preload = `<link rel="preload" as="script" href="${bundlePath}" />`;
  for (const fileName of ["index.html", "3d.html"]) {
    const filePath = path.join(distDir, fileName);
    const html = readFileSync(filePath, "utf8");
    const withPreload = html.replace("  </head>", `    ${preload}\n  </head>`);
    const withLoader = withPreload.replace(/<script defer src="src\/map3d\.js\?v=[^"]+"><\/script>/, inlineLoader);
    if (withLoader === withPreload) throw new Error(`Unable to replace map3d.js tag in ${fileName}`);
    writeFileSync(filePath, withLoader, "utf8");
  }
}

assertDistPath(distDir);
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

cpSync(path.join(siteDir, "index.html"), path.join(distDir, "index.html"));
cpSync(path.join(siteDir, "3d.html"), path.join(distDir, "3d.html"));
cpSync(path.join(siteDir, "_headers"), path.join(distDir, "_headers"));
copyDir(path.join(siteDir, "src"), path.join(distDir, "src"), (sourcePath) => {
  return path.basename(sourcePath) === "app.js";
});
for (const fileName of ["index.html", "3d.html"]) {
  const filePath = path.join(distDir, fileName);
  updateStaticCityMenu(filePath);
  versionStylesheets(filePath);
}
bundleMap3dScript();
copyDir(path.join(siteDir, "public"), path.join(distDir, "public"));
copyDir(path.join(siteDir, "data3d"), path.join(distDir, "data3d"));

console.log(`Created ${distDir}`);
