import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = path.resolve(process.argv[2] ?? "");
assert.notEqual(artifactRoot, repositoryRoot, "Pass the published wwwroot directory as the artifact path.");

const read = (relativePath) => readFile(path.join(artifactRoot, relativePath), "utf8");
const exists = async (relativePath) => {
  try {
    await stat(path.join(artifactRoot, relativePath));
    return true;
  } catch {
    return false;
  }
};

assert.equal((await read("CNAME")).trim(), "www.oakideas.com", "The production custom domain must be included.");
assert.ok(await exists(".nojekyll"), "GitHub Pages requires .nojekyll to publish _framework assets.");
assert.ok(await exists("css/app.css"), "The Tailwind stylesheet must be published.");

const index = await read("index.html");
assert.match(index, /<base href="\/">/i, "The custom-domain site must use a root base href.");
const importMapScript = index.match(/<script\s+type="importmap">([\s\S]*?)<\/script>/i);
assert.ok(importMapScript, "The published page must include its .NET asset import map.");
const importMap = JSON.parse(importMapScript[1]);
for (const resource of ["dotnet.js", "dotnet.native.js", "dotnet.runtime.js"]) {
  const assetPath = importMap.imports?.[`./_framework/${resource}`];
  assert.equal(typeof assetPath, "string", `The import map must resolve ${resource}.`);
  assert.ok(await exists(assetPath.replace(/^\.\//, "")), `The mapped runtime asset must exist: ${assetPath}`);
}
const runtimeScript = index.match(/src="_framework\/(blazor\.webassembly(?:\.[A-Za-z0-9]+)?\.js)"/i);
assert.ok(runtimeScript, "The published page must reference the Blazor WebAssembly runtime.");
assert.ok(await exists(`_framework/${runtimeScript[1]}`), "The referenced Blazor runtime must exist.");

const menu = JSON.parse(await read("menu.json"));
assert.equal(menu.schemaVersion, 1, "The published menu must use schema version 1.");
assert.ok(typeof menu.defaultItemId === "string" && menu.defaultItemId.trim().length > 0,
  "The menu must name its default item.");
assert.ok(Array.isArray(menu.items) && menu.items.length > 0, "The menu must contain items.");
const ids = new Set();
let hasEnabledDefault = false;

for (const item of menu.items) {
  assert.ok(item && typeof item === "object" && !Array.isArray(item), "Menu items must be objects.");
  assert.ok(typeof item.id === "string" && item.id.trim().length > 0 && !ids.has(item.id),
    "Menu item ids must be unique and non-empty.");
  ids.add(item.id);
  assert.ok(item.enabled === undefined || typeof item.enabled === "boolean",
    `Menu item ${item.id} has an invalid enabled flag.`);
  assert.ok(item.order === undefined ||
    (Number.isInteger(item.order) && item.order >= -2147483648 && item.order <= 2147483647),
  `Menu item ${item.id} has an invalid order.`);
  assert.ok(["standard", "identity"].includes(item.appearance), `Unsupported appearance: ${item.appearance}`);
  assert.ok(typeof item.title === "string" && item.title.trim().length > 0 &&
    typeof item.subtitle === "string" && item.subtitle.trim().length > 0,
  `Menu item ${item.id} needs a title and subtitle.`);
  assert.ok(item.image && typeof item.image === "object" && !Array.isArray(item.image),
    `Menu item ${item.id} needs image settings.`);
  assert.ok(typeof item.image.alt === "string" && item.image.alt.trim().length > 0,
    `Menu item ${item.id} needs image alt text.`);
  assert.ok(Number.isFinite(item.image.viewportHeightRatio) && item.image.viewportHeightRatio > 0 && item.image.viewportHeightRatio <= 1,
    `Menu item ${item.id} has an invalid image height ratio.`);
  assert.equal(item.image.alignment, "bottom", `Menu item ${item.id} must use bottom image alignment.`);
  await assertSafeFile(item.image.src, ".png");

  assert.ok(item.action && typeof item.action === "object" && !Array.isArray(item.action),
    `Menu item ${item.id} needs an action.`);
  if (item.action?.type === "content") {
    assert.ok(item.action.url == null, `Content menu item ${item.id} cannot include a URL.`);
    await assertSafeFile(item.action.contentPath, ".html");
  } else if (item.action?.type === "url") {
    assert.ok(item.action.contentPath == null, `URL menu item ${item.id} cannot include a content path.`);
    assert.equal(typeof item.action.url, "string", `URL menu item ${item.id} needs a URL.`);
    const url = new URL(item.action.url);
    assert.equal(url.protocol, "https:", `Menu item ${item.id} must use HTTPS links.`);
    assert.ok(url.host, `Menu item ${item.id} must use an absolute URL.`);
  } else {
    assert.fail(`Menu item ${item.id} has an unsupported action.`);
  }

  if (item.id === menu.defaultItemId && item.enabled) {
    hasEnabledDefault = true;
  }
}

assert.ok(hasEnabledDefault, "The default menu item must be enabled.");

async function assertSafeFile(relativePath, extension) {
  assert.equal(typeof relativePath, "string", "Referenced files must have a relative path.");
  assert.ok(!relativePath.includes("%") && !relativePath.includes("\\") && !relativePath.startsWith("/") &&
    !relativePath.includes(":"),
    `Unsafe static path: ${relativePath}`);
  const segments = relativePath.split("/");
  assert.ok(segments.every(segment => /^[A-Za-z0-9._-]+$/.test(segment) && segment !== "." && segment !== ".."),
    `Unsafe static path: ${relativePath}`);
  assert.ok(relativePath.toLowerCase().endsWith(extension), `Unexpected file type for ${relativePath}.`);
  const resolvedPath = path.resolve(artifactRoot, ...segments);
  assert.ok(resolvedPath.startsWith(`${artifactRoot}${path.sep}`), `Path escapes the published artifact: ${relativePath}`);
  assert.ok(await exists(relativePath), `Referenced static asset does not exist: ${relativePath}`);
}

async function ensureNoSourceFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      assert.ok(![".github", "node_modules", "obj", "bin"].includes(entry.name),
        `Development directory must not be published: ${path.relative(artifactRoot, absolutePath)}`);
      await ensureNoSourceFiles(absolutePath);
    } else {
      assert.ok(!/\.(?:cs|razor|ts|pdb|map)$/i.test(entry.name),
        `Development source must not be published: ${path.relative(artifactRoot, absolutePath)}`);
    }
  }
}

await ensureNoSourceFiles(artifactRoot);
console.log(`Static artifact verified: ${artifactRoot}`);
