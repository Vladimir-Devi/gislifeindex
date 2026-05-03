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
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(siteDir, "..");
const distDir = path.join(rootDir, "site_dist");
const rawDataDir = path.join(siteDir, "data", "_raw");

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

function bundleMap3dScript() {
  const sourcePath = path.join(distDir, "src", "map3d.js");
  const source = readFileSync(sourcePath, "utf8");
  const version = source.match(/const DATA_VERSION = "([^"]+)"/)?.[1] ?? Date.now().toString();
  const bundlePath = `src/map3d.bundle.js?v=${version}`;
  writeFileSync(path.join(distDir, "src", "map3d.bundle.js"), source, "utf8");

  const loader = `(() => {
  const version = "${version}";
  const bundleUrl = "${bundlePath}";
  const fetchBundle = async () => {
    let lastError;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      try {
        const retryUrl = bundleUrl + (attempt ? "&retry=" + attempt + "-" + Date.now() : "");
        const response = await fetch(retryUrl, { signal: controller.signal });
        if (!response.ok) throw new Error("HTTP " + response.status + " " + retryUrl);
        return await response.text();
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  };
  (async () => {
    const code = await fetchBundle();
    const script = document.createElement("script");
    script.textContent = code + "\\n//# sourceURL=map3d.bundle.js";
    document.head.appendChild(script);
  })().catch((error) => {
    console.error(error);
    const menu = document.getElementById("cityMenu");
    if (menu) menu.innerHTML = '<div class="muted">Не удалось загрузить 3D-модуль. Обновите страницу.</div>';
  });
})();
`;
  writeFileSync(sourcePath, loader, "utf8");

  const inlineLoader = `<script>\n${loader.replaceAll("</script", "<\\/script")}</script>`;
  for (const fileName of ["index.html", "3d.html"]) {
    const filePath = path.join(distDir, fileName);
    const html = readFileSync(filePath, "utf8");
    const updated = html.replace(
      /<script defer src="src\/map3d\.js\?v=[^"]+"><\/script>/,
      inlineLoader
    );
    if (updated === html) throw new Error(`Unable to replace map3d.js tag in ${fileName}`);
    writeFileSync(filePath, updated, "utf8");
  }
}

assertDistPath(distDir);
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

cpSync(path.join(siteDir, "index.html"), path.join(distDir, "index.html"));
cpSync(path.join(siteDir, "2d.html"), path.join(distDir, "2d.html"));
cpSync(path.join(siteDir, "3d.html"), path.join(distDir, "3d.html"));
cpSync(path.join(siteDir, "_headers"), path.join(distDir, "_headers"));
copyDir(path.join(siteDir, "src"), path.join(distDir, "src"));
bundleMap3dScript();
copyDir(path.join(siteDir, "public"), path.join(distDir, "public"));
copyDir(path.join(siteDir, "data"), path.join(distDir, "data"), (sourcePath) => {
  return path.resolve(sourcePath) === rawDataDir;
});
copyDir(path.join(siteDir, "data3d"), path.join(distDir, "data3d"));

console.log(`Created ${distDir}`);
