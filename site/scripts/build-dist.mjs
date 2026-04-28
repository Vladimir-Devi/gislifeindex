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

  const scriptTags = parts
    .map((_, index) => `<script defer src="src/map3d.part${index + 1}.js?v=${version}"></script>`)
    .join("\n    ");

  parts.forEach((part, index) => {
    writeFileSync(path.join(distDir, "src", `map3d.part${index + 1}.js`), part, "utf8");
  });

  const loader = `(() => {
  const version = "${version}";
  const parts = [${parts.map((_, index) => `"src/map3d.part${index + 1}.js?v=${version}"`).join(", ")}];
  const loadPart = (index) => {
    if (index >= parts.length) return;
    const script = document.createElement("script");
    script.src = parts[index];
    script.onload = () => loadPart(index + 1);
    script.onerror = () => console.error("Не удалось загрузить", parts[index]);
    document.head.appendChild(script);
  };
  loadPart(0);
})();
`;
  writeFileSync(sourcePath, loader, "utf8");

  for (const fileName of ["index.html", "3d.html"]) {
    const filePath = path.join(distDir, fileName);
    const html = readFileSync(filePath, "utf8");
    const updated = html.replace(
      /<script defer src="src\/map3d\.js\?v=[^"]+"><\/script>/,
      scriptTags
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
copyDir(path.join(siteDir, "src"), path.join(distDir, "src"));
splitMap3dScript();
copyDir(path.join(siteDir, "public"), path.join(distDir, "public"));
copyDir(path.join(siteDir, "data"), path.join(distDir, "data"), (sourcePath) => {
  return path.resolve(sourcePath) === rawDataDir;
});
copyDir(path.join(siteDir, "data3d"), path.join(distDir, "data3d"));

console.log(`Created ${distDir}`);
