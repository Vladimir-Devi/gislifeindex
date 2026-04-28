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

function inlineMap3dScript() {
  const sourcePath = path.join(distDir, "src", "map3d.js");
  const source = readFileSync(sourcePath, "utf8");
  const version = source.match(/const DATA_VERSION = "([^"]+)"/)?.[1] ?? Date.now().toString();
  const inlineScript = `<script>\n${source.replaceAll("</script", "<\\/script")}\n</script>`;

  const refreshLoader = `(() => {
  const version = "${version}";
  const key = "map3d-inline-refresh-" + version;
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "1");
    const separator = location.search ? "&" : "?";
    location.replace(location.pathname + location.search + separator + "siteVersion=" + version + location.hash);
  }
})();
`;
  writeFileSync(sourcePath, refreshLoader, "utf8");

  for (const fileName of ["index.html", "3d.html"]) {
    const filePath = path.join(distDir, fileName);
    const html = readFileSync(filePath, "utf8");
    const updated = html.replace(
      /<script defer src="src\/map3d\.js\?v=[^"]+"><\/script>/,
      inlineScript
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
inlineMap3dScript();
copyDir(path.join(siteDir, "public"), path.join(distDir, "public"));
copyDir(path.join(siteDir, "data"), path.join(distDir, "data"), (sourcePath) => {
  return path.resolve(sourcePath) === rawDataDir;
});
copyDir(path.join(siteDir, "data3d"), path.join(distDir, "data3d"));

console.log(`Created ${distDir}`);
