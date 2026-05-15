import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localManifest = JSON.parse(readFileSync(path.join(siteDir, "data3d", "manifest.json"), "utf8"));
const defaultUrls = ["https://gislifeindex.ru"];
const targets = process.argv.slice(2).length ? process.argv.slice(2) : defaultUrls;
const execFileAsync = promisify(execFile);
const requiredBundleMarkers = [
  "let activeDataVersion = DATA_VERSION",
  "dataVersionFromManifest(manifest)",
  "manifest.json?v=${DATA_VERSION}&r=${refreshKey}",
  "readRouteState",
  "currentDeepLinkUrl"
];

let failed = false;

function normalizeUrl(value) {
  return value.replace(/\/+$/, "");
}

function dataVersion(manifest) {
  return String(manifest?.generatedAt || "").replace(/\D/g, "").slice(0, 14);
}

function round(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function share(value) {
  return round(Number(value) * 100, 1);
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertClose(label, actual, expected, digits = 2) {
  const actualRounded = round(actual, digits);
  const expectedRounded = round(expected, digits);
  assertEqual(label, actualRounded, expectedRounded);
}

async function fetchText(url, options = {}) {
  const curl = process.platform === "win32" ? "curl.exe" : "curl";
  const headers = {
    "cache-control": "no-cache",
    pragma: "no-cache",
    ...(options.headers || {})
  };
  const args = [
    "-k",
    "-L",
    "--compressed",
    "--max-time",
    "30",
    "-fsS",
    ...Object.entries(headers).flatMap(([key, value]) => ["-H", `${key}: ${value}`]),
    url
  ];

  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { stdout } = await execFileAsync(curl, args, {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024
      });
      return {
        body: stdout,
        headers: {}
      };
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 650 * (attempt + 1)));
    }
  }

  const message = String(lastError?.stderr || lastError?.message || lastError);
  throw new Error(`${url}: ${message.trim()}`);
}

async function fetchJson(url) {
  const { body, headers } = await fetchText(url, {
    headers: { accept: "application/json" }
  });
  return {
    body: JSON.parse(body),
    headers
  };
}

function extractBundleVersion(html) {
  return html.match(/map3d\.bundle\.js\?v=([^"&<]+)/)?.[1] ?? null;
}

function extractDataVersion(bundle) {
  return bundle.match(/const DATA_VERSION = "([^"]+)";/)?.[1] ?? null;
}

function compareCities(remoteManifest) {
  for (const localCity of localManifest.cities) {
    const remoteCity = remoteManifest.cities.find((city) => city.slug === localCity.slug);
    if (!remoteCity) throw new Error(`Missing city online: ${localCity.slug}`);

    assertClose(`${localCity.slug} index`, remoteCity.index, localCity.index);
    assertClose(`${localCity.slug} indexNoWork`, remoteCity.indexNoWork, localCity.indexNoWork);
    assertEqual(`${localCity.slug} rank`, remoteCity.rank, localCity.rank);
    assertEqual(`${localCity.slug} population`, remoteCity.population, localCity.population);
    assertEqual(`${localCity.slug} quarters`, remoteCity.stats?.quartals, localCity.stats?.quartals);
    assertEqual(`${localCity.slug} quarter population sum`, remoteCity.stats?.quarterPopulationSum, localCity.stats?.quarterPopulationSum);
    assertEqual(
      `${localCity.slug} quarter population source`,
      remoteCity.stats?.quarterPopulationSource,
      localCity.stats?.quarterPopulationSource
    );
    assertEqual(
      `${localCity.slug} quarter population field`,
      remoteCity.stats?.quarterPopulationField,
      localCity.stats?.quarterPopulationField
    );
    assertEqual(`${localCity.slug} building count`, remoteCity.stats3d?.buildings, localCity.stats3d?.buildings);
    assertClose(`${localCity.slug} lowShare`, remoteCity.lowShare, localCity.lowShare, 3);
    assertClose(`${localCity.slug} midShare`, remoteCity.midShare, localCity.midShare, 3);
    assertClose(`${localCity.slug} highShare`, remoteCity.highShare, localCity.highShare, 3);

    for (const [blockKey, localValue] of Object.entries(localCity.blocks || {})) {
      assertClose(`${localCity.slug} block ${blockKey}`, remoteCity.blocks?.[blockKey], localValue);
    }

    console.log(
      `  ${localCity.slug}: index ${round(remoteCity.index)}, quarterPop ${remoteCity.stats?.quarterPopulationSum} (${remoteCity.stats?.quarterPopulationField}), shares ${share(remoteCity.lowShare)}/${share(remoteCity.midShare)}/${share(remoteCity.highShare)}`
    );
  }
}

async function compareQuarterMeta(origin, remoteManifest, bundleDataVersion) {
  for (const localCity of localManifest.cities) {
    const remoteCity = remoteManifest.cities.find((city) => city.slug === localCity.slug);
    const localMeta = JSON.parse(readFileSync(path.join(siteDir, "data3d", localCity.slug, "quartals-meta.json"), "utf8"));
    const remoteUrl = `${origin}/${remoteCity.files3d.quartalsMeta}?v=${bundleDataVersion}&r=${Date.now()}`;
    const { body: remoteMeta } = await fetchJson(remoteUrl);
    assertEqual(`${localCity.slug} published quarter meta count`, remoteMeta.count, localMeta.count);
    assertEqual(`${localCity.slug} published quarter meta population sum`, remoteMeta.populationSum, localMeta.populationSum);
    assertEqual(`${localCity.slug} published quarter meta population field`, remoteMeta.populationField, localMeta.populationField);
  }
}

async function checkTarget(target) {
  const origin = normalizeUrl(target);
  console.log(`\nChecking ${origin}`);

  const { body: html } = await fetchText(`${origin}/`);
  const htmlBundleVersion = extractBundleVersion(html);
  if (!htmlBundleVersion) throw new Error("Bundle version not found in HTML");
  console.log(`  html bundle version: ${htmlBundleVersion}`);

  const { body: bundle } = await fetchText(`${origin}/src/map3d.bundle.js?v=${htmlBundleVersion}`);
  const bundleDataVersion = extractDataVersion(bundle);
  if (!bundleDataVersion) throw new Error("DATA_VERSION not found in bundle");
  assertEqual("bundle DATA_VERSION", bundleDataVersion, dataVersion(localManifest));
  if (!htmlBundleVersion.startsWith(`${bundleDataVersion}-`)) {
    throw new Error(`Bundle version should start with ${bundleDataVersion}- and include a code hash, got ${htmlBundleVersion}`);
  }
  for (const marker of requiredBundleMarkers) {
    if (!bundle.includes(marker)) throw new Error(`Bundle cache-busting marker missing: ${marker}`);
  }
  console.log(`  bundle DATA_VERSION: ${bundleDataVersion}`);

  const manifestUrl = `${origin}/data3d/manifest.json?v=${bundleDataVersion}&r=${Date.now()}`;
  const { body: remoteManifest, headers } = await fetchJson(manifestUrl);
  assertEqual("manifest generatedAt", remoteManifest.generatedAt, localManifest.generatedAt);
  assertEqual("manifest data version", dataVersion(remoteManifest), dataVersion(localManifest));
  assertEqual("tileCount", remoteManifest.tileCount, localManifest.tileCount);
  console.log(`  manifest generatedAt: ${remoteManifest.generatedAt}`);

  compareCities(remoteManifest);
  await compareQuarterMeta(origin, remoteManifest, bundleDataVersion);

  const cacheControl = headers["cache-control"] || "";
  if (/immutable/i.test(cacheControl)) {
    console.log("  note: data files are immutable, but manifest is requested with a refresh parameter");
  }
}

for (const target of targets) {
  try {
    await checkTarget(target);
  } catch (error) {
    failed = true;
    console.error(`\nFAIL ${normalizeUrl(target)}`);
    console.error(`  ${error.message}`);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("\nPublished site matches local data.");
}
