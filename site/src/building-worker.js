const FLOATS_PER_VERTEX = 7;
const NON_MKD_HEIGHT_FACTOR = 0.48;

self.addEventListener("message", async (event) => {
  const { id, url, mode } = event.data || {};
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
    const payload = await response.json();
    const features = decodeBuildings(payload);
    const vertices = buildVertices(mode === "residential" ? features.filter(isResidentialBuilding) : features);
    const array = new Float32Array(vertices);
    self.postMessage({ id, ok: true, vertices: array.buffer }, [array.buffer]);
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error && error.message ? error.message : error) });
  }
});

function decodeBuildings(payload) {
  if (payload && Array.isArray(payload.features)) return payload.features;
  if (!payload || !["b1", "b2"].includes(payload.f) || !Array.isArray(payload.b)) return [];
  const scale = payload.s || 10;
  return payload.b.map((item) => decodeBuilding(item, scale, payload.f)).filter(Boolean);
}

function decodeBuilding(item, scale, format = "b1") {
  if (!Array.isArray(item) || item.length < 4) return null;
  const polygons = [];
  const ringStart = format === "b2" ? 4 : 3;
  for (let i = ringStart; i < item.length; i += 1) {
    const ring = decodeBuildingRing(item[i], scale);
    if (ring.length >= 3) polygons.push([ring]);
  }
  if (!polygons.length) return null;
  return {
    polygons,
    h: item[0] / scale,
    s: item[1] ? "mkd" : "area",
    r: item[2] ? 1 : 0,
    g: format === "b2" ? item[3] / scale : 0
  };
}

function decodeBuildingRing(values, scale) {
  if (!Array.isArray(values)) return [];
  const ring = [];
  let x = 0;
  let y = 0;
  for (let i = 0; i < values.length - 1; i += 2) {
    x += values[i];
    y += values[i + 1];
    ring.push([x / scale, y / scale]);
  }
  return ring;
}

function buildVertices(features) {
  const vertices = [];
  for (const feature of features) {
    const ground = feature.g || 0;
    const height = (feature.h || 8) * (feature.s === "mkd" ? 1 : NON_MKD_HEIGHT_FACTOR);
    const colors = buildingColors(feature);
    for (const polygon of feature.polygons) {
      const outer = openRing(polygon[0]);
      if (outer.length < 3) continue;
      for (let i = 0; i < outer.length; i += 1) {
        const a = outer[i];
        const b = outer[(i + 1) % outer.length];
        pushWall(vertices, a, b, ground, height, colors, wallShade(a, b));
      }
      for (const triangle of triangulateRoof(outer)) {
        const roof = ground + height;
        pushTriangle(vertices, triangle[0], roof, triangle[1], roof, triangle[2], roof, colors.roof);
      }
    }
  }
  return vertices;
}

function buildingColors(feature) {
  if (isResidentialBuilding(feature)) {
    return {
      roof: [0.78, 0.78, 0.74, 1],
      sideTop: [0.75, 0.75, 0.71, 1],
      sideBottom: [0.69, 0.69, 0.65, 1]
    };
  }
  return {
    roof: [0.68, 0.68, 0.65, 1],
    sideTop: [0.65, 0.65, 0.62, 1],
    sideBottom: [0.6, 0.6, 0.57, 1]
  };
}

function isResidentialBuilding(feature) {
  return feature.r === 1 || feature.r === true || feature.s === "mkd";
}

function pushWall(vertices, a, b, ground, height, colors, shade) {
  const top = colors.sideTop.map((value, index) => (index < 3 ? value * shade : value));
  const bottom = colors.sideBottom.map((value, index) => (index < 3 ? value * shade : value));
  const roof = ground + height;
  pushTriangle(vertices, a, ground, b, ground, b, roof, bottom, bottom, top);
  pushTriangle(vertices, a, ground, b, roof, a, roof, bottom, top, top);
}

function pushTriangle(vertices, a, za, b, zb, c, zc, colorA, colorB = colorA, colorC = colorA) {
  pushVertex(vertices, a, za, colorA);
  pushVertex(vertices, b, zb, colorB);
  pushVertex(vertices, c, zc, colorC);
}

function pushVertex(vertices, point, z, color) {
  vertices.push(point[0], point[1], z, color[0], color[1], color[2], color[3]);
}

function wallShade(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  const nx = dy / length;
  const ny = -dx / length;
  const light = nx * -0.42 + ny * -0.9;
  return clamp(0.94 + light * 0.08, 0.86, 1.04);
}

function openRing(ring) {
  const last = ring[ring.length - 1];
  if (ring.length > 1 && ring[0][0] === last[0] && ring[0][1] === last[1]) return ring.slice(0, -1);
  return ring;
}

function triangulateRoof(ring) {
  const points = cleanRoofRing(ring);
  if (points.length < 3) return [];
  const triangles = earClip(points);
  if (triangles.length > 0) return triangles;
  const reversedTriangles = earClip([...points].reverse());
  if (reversedTriangles.length > 0) return reversedTriangles;
  return fallbackRoofTriangles(points);
}

function cleanRoofRing(ring) {
  const cleaned = [];
  for (const point of ring) {
    const last = cleaned[cleaned.length - 1];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) cleaned.push(point);
  }
  while (cleaned.length > 2) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) break;
    cleaned.pop();
  }
  return removeCollinearPoints(cleaned);
}

function removeCollinearPoints(points) {
  if (points.length < 4) return points;
  const result = [];
  for (let i = 0; i < points.length; i += 1) {
    const prev = points[(i - 1 + points.length) % points.length];
    const current = points[i];
    const next = points[(i + 1) % points.length];
    if (Math.abs(signedTriangleArea(prev, current, next)) > 0.001) result.push(current);
  }
  return result.length >= 3 ? result : points;
}

function earClip(points) {
  const indexes = points.map((_, index) => index);
  const triangles = [];
  const orientation = polygonArea(points) >= 0 ? 1 : -1;
  let guard = 0;
  while (indexes.length > 3 && guard < points.length * points.length) {
    guard += 1;
    let clipped = false;
    for (let i = 0; i < indexes.length; i += 1) {
      const prevIndex = indexes[(i - 1 + indexes.length) % indexes.length];
      const currentIndex = indexes[i];
      const nextIndex = indexes[(i + 1) % indexes.length];
      const prev = points[prevIndex];
      const current = points[currentIndex];
      const next = points[nextIndex];
      if (!isConvexCorner(prev, current, next, orientation)) continue;
      if (containsRoofPoint(points, indexes, prevIndex, currentIndex, nextIndex, prev, current, next)) continue;
      triangles.push(orientation > 0 ? [prev, current, next] : [next, current, prev]);
      indexes.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (indexes.length === 3) {
    const tri = [points[indexes[0]], points[indexes[1]], points[indexes[2]]];
    triangles.push(orientation > 0 ? tri : [tri[2], tri[1], tri[0]]);
  }
  return indexes.length === 3 ? triangles : [];
}

function isConvexCorner(a, b, c, orientation) {
  return signedTriangleArea(a, b, c) * orientation > 0.001;
}

function containsRoofPoint(points, indexes, aIndex, bIndex, cIndex, a, b, c) {
  for (const index of indexes) {
    if (index === aIndex || index === bIndex || index === cIndex) continue;
    if (pointInTriangle(points[index], a, b, c)) return true;
  }
  return false;
}

function pointInTriangle(point, a, b, c) {
  const area1 = signedTriangleArea(point, a, b);
  const area2 = signedTriangleArea(point, b, c);
  const area3 = signedTriangleArea(point, c, a);
  const epsilon = 0.001;
  const hasNegative = area1 < -epsilon || area2 < -epsilon || area3 < -epsilon;
  const hasPositive = area1 > epsilon || area2 > epsilon || area3 > epsilon;
  if (hasNegative && hasPositive) return false;
  return Math.abs(area1) > epsilon && Math.abs(area2) > epsilon && Math.abs(area3) > epsilon;
}

function fallbackRoofTriangles(points) {
  if (!isConvexPolygon(points)) return [];
  const triangles = [];
  const orientation = polygonArea(points) >= 0 ? 1 : -1;
  for (let i = 1; i < points.length - 1; i += 1) {
    const triangle = [points[0], points[i], points[i + 1]];
    triangles.push(orientation > 0 ? triangle : [triangle[2], triangle[1], triangle[0]]);
  }
  return triangles;
}

function isConvexPolygon(points) {
  const orientation = polygonArea(points) >= 0 ? 1 : -1;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[(i - 1 + points.length) % points.length];
    const b = points[i];
    const c = points[(i + 1) % points.length];
    if (signedTriangleArea(a, b, c) * orientation < -0.001) return false;
  }
  return true;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function signedTriangleArea(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
