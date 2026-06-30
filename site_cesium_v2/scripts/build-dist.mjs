import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cesiumSiteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(cesiumSiteDir, "..");
const options = parseArgs(process.argv.slice(2));
const citySlug = options.city || "";
const brand = options.brand || citySlug || "";
const distDir = options.out ? path.resolve(cesiumSiteDir, options.out) : path.join(rootDir, "site_dist");

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--city") result.city = args[++index];
    else if (arg.startsWith("--city=")) result.city = arg.slice("--city=".length);
    else if (arg === "--brand") result.brand = args[++index];
    else if (arg.startsWith("--brand=")) result.brand = arg.slice("--brand=".length);
    else if (arg === "--out") result.out = args[++index];
    else if (arg.startsWith("--out=")) result.out = arg.slice("--out=".length);
  }
  return result;
}

function assertDistPath(target) {
  const resolved = path.resolve(target);
  const basename = path.basename(resolved);
  const isImmediateRootChild = path.dirname(resolved) === rootDir;
  const hasSafeName = /^site(?:_dist)?(?:_[a-z0-9-]+)?$/.test(basename);
  if (!isImmediateRootChild || !hasSafeName) {
    throw new Error(`Refusing to clean unexpected output path: ${resolved}`);
  }
}

function copyDir(source, target) {
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });

  for (const entry of readdirSync(source)) {
    const sourcePath = path.join(source, entry);
    const targetPath = path.join(target, entry);
    const stat = statSync(sourcePath);
    if (stat.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else if (stat.isFile()) {
      cpSync(sourcePath, targetPath);
    }
  }
}

function contentHash(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").slice(0, 10);
}

function ensureCesiumVendor() {
  const localVendor = path.join(cesiumSiteDir, "vendor", "cesium");
  if (existsSync(path.join(localVendor, "Cesium.js"))) return localVendor;

  const packageVendor = path.join(cesiumSiteDir, "node_modules", "cesium", "Build", "Cesium");
  if (existsSync(path.join(packageVendor, "Cesium.js"))) return packageVendor;

  throw new Error(
    "Cesium vendor files were not found. Run `npm --prefix site_cesium_v2 install` and `npm --prefix site_cesium_v2 run build` first."
  );
}

function versionIndexAssets() {
  const indexPath = path.join(distDir, "index.html");
  const versions = {
    styles: contentHash(path.join(distDir, "src", "styles.css")),
    mapStyles: contentHash(path.join(distDir, "src", "map3d.css")),
    mapScript: contentHash(path.join(distDir, "src", "map3d-cesium.js")),
    widgets: contentHash(path.join(distDir, "vendor", "cesium", "Widgets", "widgets.css")),
    cesium: contentHash(path.join(distDir, "vendor", "cesium", "Cesium.js"))
  };

  const html = readFileSync(indexPath, "utf8");
  let updated = html
    .replace(/href="vendor\/cesium\/Widgets\/widgets\.css(?:\?v=[^"]+)?"/, `href="vendor/cesium/Widgets/widgets.css?v=${versions.widgets}"`)
    .replace(/href="src\/styles\.css(?:\?v=[^"]+)?"/, `href="src/styles.css?v=${versions.styles}"`)
    .replace(/href="src\/map3d\.css(?:\?v=[^"]+)?"/, `href="src/map3d.css?v=${versions.mapStyles}"`)
    .replace(/src="vendor\/cesium\/Cesium\.js(?:\?v=[^"]+)?"/, `src="vendor/cesium/Cesium.js?v=${versions.cesium}"`)
    .replace(/src="src\/map3d-cesium\.js(?:\?v=[^"]+)?"/, `src="src/map3d-cesium.js?v=${versions.mapScript}"`);

  if (citySlug || brand) {
    const config = JSON.stringify({ singleCity: citySlug || null, brand: brand || null });
    updated = updated
      .replace("<title>3D-карта индекса качества городской среды</title>", "<title>Димитровград — 3D-карта индекса качества городской среды</title>")
      .replace(
        'window.CESIUM_BASE_URL = "./vendor/cesium/";',
        `window.CESIUM_BASE_URL = "./vendor/cesium/";\n      window.LIFEINDEX_SITE_CONFIG = ${config};\n      document.documentElement.dataset.brand = ${JSON.stringify(brand)};`
      );
  }

  if (updated === html) {
    throw new Error("Unable to update asset versions in index.html");
  }
  writeFileSync(indexPath, updated, "utf8");
}

function writeHeaders() {
  const headers = `/*
  X-Content-Type-Options: nosniff

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/data/manifest.json
  Cache-Control: public, max-age=0, must-revalidate

/data/*.json
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400

/data/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800

/src/*
  Cache-Control: public, max-age=31536000, immutable

/public/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/*
  Cache-Control: public, max-age=31536000, immutable
`;
  writeFileSync(path.join(distDir, "_headers"), headers, "utf8");
}

function copyData() {
  const sourceDataDir = path.join(cesiumSiteDir, "data");
  const targetDataDir = path.join(distDir, "data");
  if (!citySlug) {
    copyDir(sourceDataDir, targetDataDir);
    return;
  }

  const manifestPath = path.join(sourceDataDir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const city = manifest.cities?.find((item) => item.slug === citySlug);
  if (!city) throw new Error(`City "${citySlug}" was not found in data/manifest.json`);

  mkdirSync(targetDataDir, { recursive: true });
  writeFileSync(
    path.join(targetDataDir, "manifest.json"),
    `${JSON.stringify({ ...manifest, singleCity: citySlug, cities: [city] }, null, 2)}\n`,
    "utf8"
  );
  copyDir(path.join(sourceDataDir, citySlug), path.join(targetDataDir, citySlug));
}

assertDistPath(distDir);
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

cpSync(path.join(cesiumSiteDir, "index.html"), path.join(distDir, "index.html"));
copyDir(path.join(cesiumSiteDir, "src"), path.join(distDir, "src"));
copyDir(path.join(cesiumSiteDir, "public"), path.join(distDir, "public"));
copyData();
copyDir(ensureCesiumVendor(), path.join(distDir, "vendor", "cesium"));
writeHeaders();
versionIndexAssets();

console.log(`Built Cesium v2 site into ${distDir}${citySlug ? ` (city: ${citySlug})` : ""}`);
