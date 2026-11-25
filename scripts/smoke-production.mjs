import { pathToFileURL } from "node:url";
import { parseDotnetResourceMetadata } from "./dotnet-resource-metadata.mjs";

const productionOrigin = new URL("https://www.oakideas.com/");
const maximumAttempts = 4;
const wasmSignature = Uint8Array.of(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);
const pngSignature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const javascriptTypes = ["application/javascript", "text/javascript", "application/ecmascript", "text/ecmascript"];
const jsonTypes = ["application/json", "text/json"];
const wasmTypes = ["application/wasm", "application/octet-stream"];

function staticPath(value, label) {
  if (value === "/") {
    return "/";
  }
  if (typeof value !== "string" || value.length === 0 || value.startsWith("//") || value.includes("%") ||
    value.includes("\\") || value.includes(":") || value.includes("?") || value.includes("#")) {
    throw new Error(`${label} must be a safe same-origin static path.`);
  }

  const normalized = value.replace(/^\.\//, "").replace(/^\/+/, "");
  if (normalized.length === 0) {
    throw new Error(`${label} must be a safe same-origin static path.`);
  }

  const segments = normalized.split("/");
  if (!segments.every(segment => /^[A-Za-z0-9._-]+$/.test(segment) && segment !== "." && segment !== "..")) {
    throw new Error(`${label} must be a safe same-origin static path: ${value}`);
  }

  return `/${normalized}`;
}

function safeResourcePath(value, label) {
  try {
    return staticPath(value, label);
  } catch (error) {
    throw new Error(`${label} (${String(value)}) failed after 0 attempts: ${error instanceof Error ? error.message : String(error)}`);
  }
}

class NonRetryableError extends Error {}

function mediaType(headers) {
  return (headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
}

function requireMediaType(headers, allowedTypes, label) {
  const actual = mediaType(headers);
  if (!allowedTypes.includes(actual)) {
    throw new Error(`${label} has incompatible content type ${actual || "(missing)"}`);
  }
}

function decodeText(bytes, label) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new Error(`${label} is not valid UTF-8: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function requireNonEmptyText(text, label) {
  if (text.trim().length === 0) {
    throw new Error(`${label} response is empty`);
  }
}

function isHtmlDocument(text) {
  return /^(?:<!doctype\s+html\b|<html\b|<head\b|<body\b)/i.test(text.trimStart());
}

function requireNotHtmlFallback(text, label) {
  if (isHtmlDocument(text)) {
    throw new Error(`${label} returned an HTML fallback document`);
  }
}

function requireJavaScript(bytes, headers, label) {
  requireMediaType(headers, javascriptTypes, label);
  const text = decodeText(bytes, label);
  requireNonEmptyText(text, label);
  requireNotHtmlFallback(text, label);
  return text;
}

function requireWasm(bytes, headers, label) {
  requireMediaType(headers, wasmTypes, label);
  if (bytes.length < wasmSignature.length || !wasmSignature.every((byte, index) => bytes[index] === byte)) {
    throw new Error(`${label} has an invalid WebAssembly signature`);
  }
  return bytes;
}

function requirePng(bytes, headers, label) {
  requireMediaType(headers, ["image/png"], label);
  if (bytes.length < pngSignature.length || !pngSignature.every((byte, index) => bytes[index] === byte)) {
    throw new Error(`${label} has an invalid PNG signature`);
  }
  return bytes;
}

function requireHtmlFragment(bytes, headers, label) {
  requireMediaType(headers, ["text/html"], label);
  const text = decodeText(bytes, label);
  requireNonEmptyText(text, label);
  if (!/<[a-z][^>]*>/i.test(text)) {
    throw new Error(`${label} is not HTML content`);
  }
  if (isHtmlDocument(text) || /<base\b|<script\b[^>]*blazor\.webassembly|id=["']app["']/i.test(text)) {
    throw new Error(`${label} returned the application's root fallback document`);
  }
  return text;
}

function parseJson(bytes, headers, label) {
  requireMediaType(headers, jsonTypes, label);
  const text = decodeText(bytes, label);
  requireNonEmptyText(text, label);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateMenu(menu) {
  if (!menu || typeof menu !== "object" || Array.isArray(menu) || menu.schemaVersion !== 1 ||
    typeof menu.defaultItemId !== "string" || menu.defaultItemId.trim().length === 0 ||
    !Array.isArray(menu.items) || menu.items.length === 0) {
    throw new Error("menu.json must contain schemaVersion 1, a defaultItemId, and a non-empty items array");
  }

  const ids = new Set();
  const defaultItem = menu.items.find(item => item?.id === menu.defaultItemId && item.enabled !== false);
  if (!defaultItem) {
    throw new Error("menu.json defaultItemId must identify an enabled menu item");
  }

  for (const item of menu.items) {
    if (!item || typeof item !== "object" || Array.isArray(item) ||
      typeof item.id !== "string" || item.id.trim().length === 0 || ids.has(item.id) ||
      (item.enabled !== undefined && typeof item.enabled !== "boolean") ||
      !["standard", "identity"].includes(item.appearance) ||
      typeof item.title !== "string" || item.title.trim().length === 0 ||
      typeof item.subtitle !== "string" || item.subtitle.trim().length === 0 ||
      !item.image || typeof item.image !== "object" || Array.isArray(item.image) ||
      typeof item.image.src !== "string" || typeof item.image.alt !== "string" ||
      item.image.alt.trim().length === 0 ||
      !Number.isFinite(item.image.viewportHeightRatio) || item.image.viewportHeightRatio <= 0 ||
      item.image.viewportHeightRatio > 1 || item.image.alignment !== "bottom" ||
      !item.action || typeof item.action !== "object" || Array.isArray(item.action) ||
      (item.action.type !== "content" && item.action.type !== "url") ||
      (item.action.type === "content" && typeof item.action.contentPath !== "string") ||
      (item.action.type === "url" && typeof item.action.url !== "string")) {
      throw new Error("menu.json contains an item with missing or invalid required properties");
    }
    ids.add(item.id);

    if (item.action.type === "url") {
      let url;
      try {
        url = new URL(item.action.url);
      } catch {
        throw new Error(`menu.json URL for item ${item.id} is invalid`);
      }
      if (url.protocol !== "https:" || url.username || url.password) {
        throw new Error(`menu.json URL for item ${item.id} must use HTTPS and cannot contain credentials`);
      }
    }
  }
  return menu;
}

function parseRootDocument(bytes, headers) {
  requireMediaType(headers, ["text/html"], "HTTPS root document");
  const html = decodeText(bytes, "HTTPS root document");
  requireNonEmptyText(html, "HTTPS root document");
  if (!/<base\s+href=["']\/["']\s*>/i.test(html)) {
    throw new Error("root document is missing the expected <base href=\"/\">");
  }

  const runtimeMatch = html.match(/<script\b[^>]*\bsrc=["']([^"']*_framework\/blazor\.webassembly(?:\.[^/"']+)?\.js)["'][^>]*>/i);
  if (!runtimeMatch) {
    throw new Error("root document does not reference the Blazor WebAssembly bootstrap script");
  }

  const importMapMatch = html.match(/<script\s+type=["']importmap["']>([\s\S]*?)<\/script>/i);
  if (!importMapMatch) {
    throw new Error("root document is missing the .NET asset import map");
  }

  let importMap;
  try {
    importMap = JSON.parse(importMapMatch[1]);
  } catch (error) {
    throw new Error(`root document has an invalid .NET asset import map: ${error instanceof Error ? error.message : String(error)}`);
  }

  const dotnetScript = importMap.imports?.["./_framework/dotnet.js"];
  if (typeof dotnetScript !== "string") {
    throw new Error("root document import map does not reference dotnet.js");
  }

  return { runtimeScript: runtimeMatch[1], dotnetScript };
}

async function request(path, label, fetchImpl, attempts, retryDelayMs, timeoutMs, validate) {
  const safePath = safeResourcePath(path, label);
  const url = new URL(safePath, productionOrigin);
  let lastError;
  let attemptsMade = 0;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    attemptsMade = attempt;
    try {
      const response = await fetchImpl(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs)
      });
      const finalUrl = new URL(response.url || url.href);
      if (finalUrl.protocol !== "https:" || finalUrl.host !== productionOrigin.host) {
        throw new NonRetryableError(`redirected to unexpected origin ${finalUrl.origin}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`);
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      return validate(bytes, response.headers, label);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (error instanceof NonRetryableError || attempt === attempts) {
        break;
      }
      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  throw new Error(`${label} (${safePath}) failed after ${attemptsMade} attempt${attemptsMade === 1 ? "" : "s"}: ${lastError}`);
}

export async function verifyProductionSite({
  fetchImpl = fetch,
  attempts = maximumAttempts,
  retryDelayMs = 2000,
  timeoutMs = 8000,
  expectedRevision
} = {}) {
  const retryLimit = Math.min(Math.max(Number.isInteger(attempts) ? attempts : maximumAttempts, 1), maximumAttempts);
  if (typeof expectedRevision !== "string" || !/^[a-f0-9]{40}$/.test(expectedRevision)) {
    throw new Error("Expected deployment revision must be the 40-character source commit SHA.");
  }

  const root = await request("/", "HTTPS root document", fetchImpl, retryLimit, retryDelayMs, timeoutMs,
    parseRootDocument);
  const [menu, , dotnetMetadata] = await Promise.all([
    request("/menu.json", "menu configuration", fetchImpl, retryLimit, retryDelayMs, timeoutMs,
      (bytes, headers) => validateMenu(parseJson(bytes, headers, "menu.json"))),
    request(root.runtimeScript, "Blazor WebAssembly bootstrap", fetchImpl, retryLimit, retryDelayMs, timeoutMs,
      (bytes, headers) => requireJavaScript(bytes, headers, "Blazor WebAssembly bootstrap")),
    request(root.dotnetScript, ".NET asset loader", fetchImpl, retryLimit, retryDelayMs, timeoutMs,
      (bytes, headers) => parseDotnetResourceMetadata(
        requireJavaScript(bytes, headers, ".NET asset loader"))),
    request("/deployment-revision.txt", "deployment revision marker", fetchImpl, retryLimit, retryDelayMs, timeoutMs,
      (bytes, headers) => {
        requireMediaType(headers, ["text/plain"], "deployment revision marker");
        const revision = decodeText(bytes, "deployment revision marker").trim();
        if (revision !== expectedRevision) {
          throw new Error(`expected ${expectedRevision}, received ${revision || "(empty)"}`);
        }
        return revision;
      })
  ]);

  for (const item of menu.items) {
    safeResourcePath(item.image.src, `image for menu item ${item.id}`);
    if (item.action.type === "content") {
      safeResourcePath(item.action.contentPath, `content for menu item ${item.id}`);
    }
  }

  const assetChecks = [];
  for (const item of menu.items) {
    assetChecks.push(request(item?.image?.src, `image for menu item ${item?.id ?? "(unknown)"}`,
      fetchImpl, retryLimit, retryDelayMs, timeoutMs, requirePng));
    if (item?.action?.type === "content") {
      assetChecks.push(request(item.action.contentPath, `content for menu item ${item.id ?? "(unknown)"}`,
        fetchImpl, retryLimit, retryDelayMs, timeoutMs, requireHtmlFragment));
    }
  }

  assetChecks.push(request(`_framework/${dotnetMetadata.nativeRuntime}`, "native WebAssembly runtime",
    fetchImpl, retryLimit, retryDelayMs, timeoutMs, requireWasm));
  assetChecks.push(request(`_framework/${dotnetMetadata.mainAssembly}`, "main managed assembly",
    fetchImpl, retryLimit, retryDelayMs, timeoutMs, requireWasm));
  await Promise.all(assetChecks);

  console.log(`Production smoke check passed for ${productionOrigin.origin}: HTTPS root, menu, ` +
    `${menu.items.length} menu item(s), native runtime, managed assembly and revision ${expectedRevision}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyProductionSite({ expectedRevision: process.env.EXPECTED_DEPLOYMENT_REVISION }).catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
