import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || process.env.PORT || 4283);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".b3dm": "application/octet-stream",
  ".i3dm": "application/octet-stream",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function resolveRequest(url) {
  const parsed = new URL(url, "http://127.0.0.1");
  const safePath = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  let target = path.resolve(rootDir, safePath || "index.html");
  if (!target.startsWith(rootDir)) target = path.join(rootDir, "index.html");
  if (existsSync(target) && statSync(target).isDirectory()) target = path.join(target, "index.html");
  if (!existsSync(target)) target = path.join(rootDir, "index.html");
  return target;
}

createServer((request, response) => {
  const target = resolveRequest(request.url || "/");
  const ext = path.extname(target).toLowerCase();
  response.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  createReadStream(target).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Cesium interface v2: http://127.0.0.1:${port}/`);
});
