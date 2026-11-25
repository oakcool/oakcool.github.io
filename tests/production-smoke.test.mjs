import assert from "node:assert/strict";
import test from "node:test";
import { verifyProductionSite } from "../scripts/smoke-production.mjs";

const menu = {
  schemaVersion: 1,
  items: [
    { id: "identity", image: { src: "Content/identity.png" }, action: { type: "content", contentPath: "content/identity.html" } },
    { id: "projects", image: { src: "Content/projects.png" }, action: { type: "content", contentPath: "content/projects.html" } }
  ]
};

const rootDocument = '<base href="/"><script type="importmap">{"imports":{"./_framework/dotnet.js":"./_framework/dotnet.test.js"}}</script>' +
  '<script src="_framework/blazor.webassembly.js"></script>';
const dotnetLoader = 'const wasm = "System.Private.CoreLib.test.wasm";';

function createFetch({ unavailablePath, unavailableAttempts = 0, redirectPath } = {}) {
  const calls = new Map();
  const fetchImpl = async url => {
    const requestUrl = new URL(url);
    const path = requestUrl.pathname;
    const count = (calls.get(path) ?? 0) + 1;
    calls.set(path, count);

    if (path === unavailablePath && count <= unavailableAttempts) {
      return new Response("temporarily unavailable", { status: 503, statusText: "Service Unavailable" });
    }

    if (path === redirectPath) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        url: "http://unexpected.example/",
        text: async () => rootDocument
      };
    }

    const body = new Map([
      ["/", rootDocument],
      ["/menu.json", JSON.stringify(menu)],
      ["/_framework/dotnet.test.js", dotnetLoader]
    ]).get(path) ?? "";
    return new Response(body, { status: 200 });
  };

  return { fetchImpl, calls };
}

test("checks HTTPS root, framework, menu, content, and every menu image", async () => {
  const { fetchImpl, calls } = createFetch();

  await verifyProductionSite({ fetchImpl, retryDelayMs: 0 });

  for (const path of [
    "/", "/menu.json", "/_framework/blazor.webassembly.js", "/_framework/dotnet.test.js",
    "/_framework/System.Private.CoreLib.test.wasm", "/Content/identity.png",
    "/content/identity.html", "/Content/projects.png", "/content/projects.html"
  ]) {
    assert.equal(calls.get(path), 1, `Expected one successful request for ${path}`);
  }
});

test("retries transient service failures and reports exhausted retries with the path", async () => {
  const { fetchImpl, calls } = createFetch({
    unavailablePath: "/menu.json",
    unavailableAttempts: 2
  });

  await verifyProductionSite({ fetchImpl, attempts: 3, retryDelayMs: 0 });
  assert.equal(calls.get("/menu.json"), 3);

  const unavailable = createFetch({ unavailablePath: "/menu.json", unavailableAttempts: 5 });
  await assert.rejects(
    verifyProductionSite({ fetchImpl: unavailable.fetchImpl, attempts: 3, retryDelayMs: 0 }),
    /menu configuration \(\/menu\.json\) failed after 3 attempts: HTTP 503 Service Unavailable/
  );
  assert.equal(unavailable.calls.get("/menu.json"), 3);
});

test("rejects redirects away from the HTTPS custom domain", async () => {
  const { fetchImpl } = createFetch({ redirectPath: "/" });

  await assert.rejects(
    verifyProductionSite({ fetchImpl, retryDelayMs: 0 }),
    /HTTPS root document \(\/\) failed after 4 attempts: redirected to unexpected origin http:\/\/unexpected\.example/
  );
});
