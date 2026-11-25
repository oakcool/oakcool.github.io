import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDotnetResourceMetadata } from "./dotnet-resource-metadata.mjs";

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
assert.match((await read("deployment-revision.txt")).trim(), /^[a-f0-9]{40}$/,
  "The artifact must include the 40-character source commit deployment revision.");

const index = await read("index.html");
assert.match(index, /<base href="\/">/i, "The custom-domain site must use a root base href.");
const importMapScript = index.match(/<script\s+type="importmap">([\s\S]*?)<\/script>/i);
assert.ok(importMapScript, "The published page must include its .NET asset import map.");
const importMap = JSON.parse(importMapScript[1]);
let dotnetLoaderPath;
for (const resource of ["dotnet.js", "dotnet.native.js", "dotnet.runtime.js"]) {
  const assetPath = importMap.imports?.[`./_framework/${resource}`];
  assert.equal(typeof assetPath, "string", `The import map must resolve ${resource}.`);
  assert.ok(await exists(assetPath.replace(/^\.\//, "")), `The mapped runtime asset must exist: ${assetPath}`);
  if (resource === "dotnet.js") {
    dotnetLoaderPath = assetPath.replace(/^\.\//, "");
  }
}
const dotnetMetadata = parseDotnetResourceMetadata(await read(dotnetLoaderPath));
await assertSafeWasm(`_framework/${dotnetMetadata.nativeRuntime}`, "Native .NET runtime");
await assertSafeWasm(`_framework/${dotnetMetadata.mainAssembly}`, "Main managed assembly");
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
    assert.equal(url.username, "", "Menu URLs must not include credentials.");
    assert.equal(url.password, "", "Menu URLs must not include credentials.");
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

async function assertSafeWasm(relativePath, label) {
  await assertSafeFile(relativePath, ".wasm");
  const bytes = await readFile(path.join(artifactRoot, relativePath));
  assert.ok(bytes.length >= 8 &&
    Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])),
  `${label} must have the WebAssembly binary signature.`);
}

async function ensureNoSourceFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(artifactRoot, absolutePath).replaceAll(path.sep, "/");
    assert.ok(!isObsoleteResource(relativePath),
      `Obsolete or development file must not be published: ${relativePath}`);
    if (entry.isDirectory()) {
      assert.ok(![".github", ".git", ".aspire", ".vs", "node_modules", "obj", "bin", "docs", "src", "tests", "styles"]
        .includes(entry.name.toLowerCase()),
        `Development directory must not be published: ${path.relative(artifactRoot, absolutePath)}`);
      await ensureNoSourceFiles(absolutePath);
    } else {
      assert.ok(!/\.(?:cs|razor|ts|pdb|map|less|csproj|sln|slnx)$/i.test(entry.name) &&
        !["agents.md", "readme.md", "packages.config"].includes(entry.name.toLowerCase()),
        `Development source must not be published: ${path.relative(artifactRoot, absolutePath)}`);
    }
  }
}

function isObsoleteResource(relativePath) {
  const normalizedPath = relativePath.toLowerCase();
  const fileName = path.posix.basename(normalizedPath);
  return normalizedPath === "scripts" ||
    normalizedPath.startsWith("scripts/") ||
    normalizedPath === "content/bootstrap" ||
    normalizedPath.startsWith("content/bootstrap/") ||
    ["content/bootstrap.css", "content/bootstrap.min.css", "content/site.css", "content/site.less",
      "content/thumbs.db", "app.js", "app.js.map"].includes(normalizedPath) ||
    /^oakideas\.github\.website\.(?:csproj|sln)$/.test(fileName) ||
    /^web(?:\..+)?\.config$/.test(fileName) ||
    /^compilerconfig(?:\..*)?$/.test(fileName) ||
    /^webessentials(?:\..*)?$/.test(fileName) ||
    /^glyphicons-/.test(fileName) ||
    fileName === "thumbs.db" ||
    fileName.endsWith(".less");
}

await ensureNoSourceFiles(artifactRoot);
console.log(`Static artifact verified: ${artifactRoot}`);
