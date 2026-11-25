import { pathToFileURL } from "node:url";

const productionOrigin = new URL("https://www.oakideas.com/");
const maximumAttempts = 4;

function staticPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || value.includes("%") ||
    value.includes("\\") || value.includes(":") || value.includes("?") || value.includes("#")) {
    throw new Error(`${label} must be a safe same-origin static path.`);
  }

  const normalized = value.replace(/^\.\//, "").replace(/^\/+/, "");
  if (normalized.length === 0) {
    return "/";
  }

  const segments = normalized.split("/");
  if (!segments.every(segment => /^[A-Za-z0-9._-]+$/.test(segment) && segment !== "." && segment !== "..")) {
    throw new Error(`${label} must be a safe same-origin static path: ${value}`);
  }

  return `/${normalized}`;
}

async function request(path, label, fetchImpl, attempts, retryDelayMs, timeoutMs) {
  const safePath = staticPath(path, label);
  const url = new URL(safePath, productionOrigin);
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetchImpl(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs)
      });
      const finalUrl = new URL(response.url || url.href);
      if (finalUrl.protocol !== "https:" || finalUrl.host !== productionOrigin.host) {
        throw new Error(`redirected to unexpected origin ${finalUrl.origin}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  throw new Error(`${label} (${safePath}) failed after ${attempts} attempts: ${lastError}`);
}

export async function verifyProductionSite({
  fetchImpl = fetch,
  attempts = maximumAttempts,
  retryDelayMs = 2000,
  timeoutMs = 8000
} = {}) {
  const retryLimit = Math.min(Math.max(Number.isInteger(attempts) ? attempts : maximumAttempts, 1), maximumAttempts);
  const rootResponse = await request("/", "HTTPS root document", fetchImpl, retryLimit, retryDelayMs, timeoutMs);
  const html = await rootResponse.text();
  if (!/<base\s+href=["']\/["']\s*>/i.test(html)) {
    throw new Error("HTTPS root document is missing the expected <base href=\"/\">.");
  }

  const runtimeMatch = html.match(/<script\b[^>]*\bsrc=["']([^"']*_framework\/blazor\.webassembly(?:\.[^/"']+)?\.js)["'][^>]*>/i);
  if (!runtimeMatch) {
    throw new Error("HTTPS root document does not reference the Blazor WebAssembly runtime.");
  }

  const importMapMatch = html.match(/<script\s+type=["']importmap["']>([\s\S]*?)<\/script>/i);
  if (!importMapMatch) {
    throw new Error("HTTPS root document is missing the .NET asset import map.");
  }

  let importMap;
  try {
    importMap = JSON.parse(importMapMatch[1]);
  } catch (error) {
    throw new Error(`The .NET asset import map is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const dotnetScript = importMap.imports?.["./_framework/dotnet.js"];
  if (typeof dotnetScript !== "string") {
    throw new Error("The .NET asset import map does not reference dotnet.js.");
  }

  const [menuResponse, , dotnetResponse] = await Promise.all([
    request("/menu.json", "menu configuration", fetchImpl, retryLimit, retryDelayMs, timeoutMs),
    request(runtimeMatch[1], "Blazor WebAssembly runtime", fetchImpl, retryLimit, retryDelayMs, timeoutMs),
    request(dotnetScript, ".NET asset loader", fetchImpl, retryLimit, retryDelayMs, timeoutMs)
  ]);
  let menu;
  try {
    menu = await menuResponse.json();
  } catch (error) {
    throw new Error(`menu.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (menu?.schemaVersion !== 1 || !Array.isArray(menu.items) || menu.items.length === 0) {
    throw new Error("menu.json must contain a non-empty schema-version-1 item list.");
  }

  const assetChecks = [];
  for (const item of menu.items) {
    assetChecks.push(request(item?.image?.src, `image for menu item ${item?.id ?? "(unknown)"}`,
      fetchImpl, retryLimit, retryDelayMs, timeoutMs));
    if (item?.action?.type === "content") {
      assetChecks.push(request(item.action.contentPath, `content for menu item ${item.id ?? "(unknown)"}`,
        fetchImpl, retryLimit, retryDelayMs, timeoutMs));
    }
  }

  const loaderScript = await dotnetResponse.text();
  const wasmAsset = loaderScript.match(/System\.Private\.CoreLib\.[A-Za-z0-9._-]+\.wasm/)?.[0];
  if (!wasmAsset) {
    throw new Error(".NET asset loader does not reference the WebAssembly runtime asset.");
  }

  assetChecks.push(request(`_framework/${wasmAsset}`, "Blazor WebAssembly asset",
    fetchImpl, retryLimit, retryDelayMs, timeoutMs));
  await Promise.all(assetChecks);

  console.log(`Production smoke check passed for ${productionOrigin.origin}: HTTPS root, menu, ` +
    `${menu.items.length} menu item(s), Blazor runtime, .NET loader and WebAssembly asset.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyProductionSite().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
