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

function splitMap3dScript() {
  const sourcePath = path.join(distDir, "src", "map3d.js");
  const source = readFileSync(sourcePath, "utf8");
  const parts = source.split(/^\/\/ @dist-split\r?\n/gm);
  const version = source.match(/const DATA_VERSION = "([^"]+)"/)?.[1] ?? Date.now().toString();
  if (parts.length < 2) {
    throw new Error("map3d.js does not contain dist split markers");
  }

  parts.forEach((part, index) => {
    writeFileSync(path.join(distDir, "src", `map3d.part${index + 1}.js`), part, "utf8");
  });

  const loader = `(() => {
  const version = "${version}";
  const parts = [${parts.map((_, index) => `"src/map3d.part${index + 1}.js?v=${version}"`).join(", ")}];
  const loadPart = (index, attempt = 0) => {
    if (index >= parts.length) return;
    const script = document.createElement("script");
    script.src = parts[index] + (attempt ? "&retry=" + attempt + "-" + Date.now() : "");
    script.onload = () => loadPart(index + 1);
    script.onerror = () => {
      if (attempt < 3) {
        setTimeout(() => loadPart(index, attempt + 1), 300 * (attempt + 1));
        return;
      }
      console.error("Не удалось загрузить", parts[index]);
    };
    document.head.appendChild(script);
  };
  loadPart(0);
})();
`;
  writeFileSync(sourcePath, loader, "utf8");
}

assertDistPath(distDir);
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

cpSync(path.join(siteDir, "index.html"), path.join(distDir, "index.html"));
cpSync(path.join(siteDir, "2d.html"), path.join(distDir, "2d.html"));
cpSync(path.join(siteDir, "3d.html"), path.join(distDir, "3d.html"));
cpSync(path.join(siteDir, "_headers"), path.join(distDir, "_headers"));
copyDir(path.join(siteDir, "src"), path.join(distDir, "src"));
splitMap3dScript();
copyDir(path.join(siteDir, "public"), path.join(distDir, "public"));
copyDir(path.join(siteDir, "data"), path.join(distDir, "data"), (sourcePath) => {
  return path.resolve(sourcePath) === rawDataDir;
});
copyDir(path.join(siteDir, "data3d"), path.join(distDir, "data3d"));

console.log(`Created ${distDir}`);
