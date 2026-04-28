import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync
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

assertDistPath(distDir);
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

cpSync(path.join(siteDir, "index.html"), path.join(distDir, "index.html"));
cpSync(path.join(siteDir, "2d.html"), path.join(distDir, "2d.html"));
cpSync(path.join(siteDir, "3d.html"), path.join(distDir, "3d.html"));
copyDir(path.join(siteDir, "src"), path.join(distDir, "src"));
copyDir(path.join(siteDir, "public"), path.join(distDir, "public"));
copyDir(path.join(siteDir, "data"), path.join(distDir, "data"), (sourcePath) => {
  return path.resolve(sourcePath) === rawDataDir;
});
copyDir(path.join(siteDir, "data3d"), path.join(distDir, "data3d"));

console.log(`Created ${distDir}`);
