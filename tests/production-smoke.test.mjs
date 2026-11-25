import assert from "node:assert/strict";
import test from "node:test";
import { verifyProductionSite } from "../scripts/smoke-production.mjs";

const expectedRevision = "a".repeat(40);
const previousRevision = "b".repeat(40);
const wasmSignature = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const menu = {
  schemaVersion: 1,
  defaultItemId: "identity",
  items: [
    { id: "identity", enabled: true, image: { src: "Content/identity.png" }, action: { type: "content", contentPath: "content/identity.html" } },
    { id: "projects", enabled: true, image: { src: "Content/projects.png" }, action: { type: "content", contentPath: "content/projects.html" } }
  ]
};
const rootDocument = '<!doctype html><html><head><base href="/">' +
  '<script type="importmap">{"imports":{"./_framework/dotnet.js":"./_framework/dotnet.test.js"}}' +
  '</script></head><body><div id="app"></div>' +
  '<script src="_framework/blazor.webassembly.js"></script></body></html>';
const dotnetMetadata = {
  mainAssemblyName: "OakIdeas.Github.Website.Client",
  resources: {
    wasmNative: [{ name: "dotnet.native.release.wasm" }],
    assembly: [{
      virtualPath: "OakIdeas.Github.Website.Client.wasm",
      name: "OakIdeas.Github.Website.Client.release.wasm"
    }]
  }
};
const dotnetLoader = `/*json-start*/${JSON.stringify(dotnetMetadata)}/*json-end*/`;
const fixtures = new Map([
  ["/", [rootDocument, "text/html; charset=utf-8"]],
  ["/menu.json", [JSON.stringify(menu), "application/json; charset=utf-8"]],
  ["/_framework/blazor.webassembly.js", ["// Blazor bootstrap runtime", "text/javascript"]],
  ["/_framework/dotnet.test.js", [dotnetLoader, "application/javascript; charset=utf-8"]],
  ["/_framework/dotnet.native.release.wasm", [wasmSignature, "application/wasm"]],
  ["/_framework/OakIdeas.Github.Website.Client.release.wasm", [wasmSignature, "application/wasm"]],
  ["/Content/identity.png", [pngSignature, "image/png"]],
  ["/Content/projects.png", [pngSignature, "image/png"]],
  ["/content/identity.html", ["<h2>Identity</h2><p>Content fragment.</p>", "text/html; charset=utf-8"]],
  ["/content/projects.html", ["<h2>Projects</h2><p>Content fragment.</p>", "text/html; charset=utf-8"]],
  ["/deployment-revision.txt", [`${expectedRevision}\n`, "text/plain; charset=utf-8"]]
]);

function makeResponse(url, body, contentType, {
  status = 200,
  statusText = "OK",
  finalUrl = url.href,
  arrayBuffer = async () => toArrayBuffer(body)
} = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    url: finalUrl,
    headers: new Headers({ "content-type": contentType }),
    arrayBuffer
  };
}

function toArrayBuffer(body) {
  const bytes = typeof body === "string" ? Buffer.from(body) : Buffer.from(body);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function createFetch({ overrides = {}, revisions = [expectedRevision] } = {}) {
  const calls = new Map();
  const fetchImpl = async url => {
    const requestUrl = new URL(url);
    const path = requestUrl.pathname;
    const count = (calls.get(path) ?? 0) + 1;
    calls.set(path, count);

    if (path === "/deployment-revision.txt") {
      const revision = revisions[Math.min(count - 1, revisions.length - 1)];
      return makeResponse(requestUrl, `${revision}\n`, "text/plain; charset=utf-8");
    }

    const override = overrides[path];
    if (override) {
      return override(requestUrl, count);
    }

    const [body, contentType] = fixtures.get(path) ?? ["not found", "text/plain"];
    return makeResponse(requestUrl, body, contentType);
  };
  return { fetchImpl, calls };
}

const run = (fetchImpl, options = {}) => verifyProductionSite({
  fetchImpl,
  expectedRevision,
  retryDelayMs: 0,
  ...options
});

test("validates realistic production resources and deployment revision", async () => {
  const { fetchImpl, calls } = createFetch();

  await run(fetchImpl);

  for (const path of [
    "/", "/menu.json", "/_framework/blazor.webassembly.js", "/_framework/dotnet.test.js",
    "/_framework/dotnet.native.release.wasm", "/_framework/OakIdeas.Github.Website.Client.release.wasm",
    "/Content/identity.png", "/content/identity.html", "/Content/projects.png",
    "/content/projects.html", "/deployment-revision.txt"
  ]) {
    assert.equal(calls.get(path), 1, `Expected one successful request for ${path}`);
  }
});

test("retries an old deployment revision until the expected revision propagates", async () => {
  const { fetchImpl, calls } = createFetch({ revisions: [previousRevision, expectedRevision] });

  await run(fetchImpl, { attempts: 3 });

  assert.equal(calls.get("/deployment-revision.txt"), 2);
});

test("retries malformed JSON and reports exhausted validation attempts", async () => {
  const { fetchImpl: recoveredFetch, calls: recoveredCalls } = createFetch({
    overrides: {
      "/menu.json": (url, count) => makeResponse(
        url,
        count === 1 ? "{broken" : JSON.stringify(menu),
        "application/json")
    }
  });

  await run(recoveredFetch, { attempts: 2 });
  assert.equal(recoveredCalls.get("/menu.json"), 2);

  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/menu.json": url => makeResponse(url, "{broken", "application/json")
    }
  });
  await assert.rejects(run(fetchImpl, { attempts: 2 }),
    /menu configuration \(\/menu\.json\) failed after 2 attempts: menu\.json is invalid JSON/);
  assert.equal(calls.get("/menu.json"), 2);
});

test("retries response-body failures before successful content validation", async () => {
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/_framework/dotnet.native.release.wasm": (url, count) => makeResponse(
        url,
        wasmSignature,
        "application/wasm",
        {
          arrayBuffer: async () => {
            if (count === 1) {
              throw new Error("connection reset while reading response body");
            }
            return toArrayBuffer(wasmSignature);
          }
        })
    }
  });

  await run(fetchImpl, { attempts: 2 });
  assert.equal(calls.get("/_framework/dotnet.native.release.wasm"), 2);
});

test("rejects a 200 JavaScript URL that returns an HTML fallback document", async () => {
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/_framework/blazor.webassembly.js": url => makeResponse(url, rootDocument, "text/html")
    }
  });

  await assert.rejects(run(fetchImpl, { attempts: 2 }),
    /Blazor WebAssembly bootstrap \(\/_framework\/blazor\.webassembly\.js\) failed after 2 attempts: Blazor WebAssembly bootstrap has incompatible content type text\/html/);
  assert.equal(calls.get("/_framework/blazor.webassembly.js"), 2);
});

test("rejects empty JavaScript bodies and retries validation", async () => {
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/_framework/blazor.webassembly.js": url => makeResponse(url, "", "text/javascript")
    }
  });

  await assert.rejects(run(fetchImpl, { attempts: 2 }),
    /Blazor WebAssembly bootstrap \(\/_framework\/blazor\.webassembly\.js\) failed after 2 attempts: Blazor WebAssembly bootstrap response is empty/);
  assert.equal(calls.get("/_framework/blazor.webassembly.js"), 2);
});

test("rejects an invalid native WebAssembly signature", async () => {
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/_framework/dotnet.native.release.wasm": url => makeResponse(url, "not wasm", "application/wasm")
    }
  });

  await assert.rejects(run(fetchImpl, { attempts: 2 }),
    /native WebAssembly runtime \(\/_framework\/dotnet\.native\.release\.wasm\) failed after 2 attempts: native WebAssembly runtime has an invalid WebAssembly signature/);
  assert.equal(calls.get("/_framework/dotnet.native.release.wasm"), 2);
});

test("requires native runtime metadata and retries malformed loader responses", async () => {
  const missingRuntime = {
    ...dotnetMetadata,
    resources: { ...dotnetMetadata.resources, wasmNative: [] }
  };
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/_framework/dotnet.test.js": url => makeResponse(
        url, `/*json-start*/${JSON.stringify(missingRuntime)}/*json-end*/`, "text/javascript")
    }
  });

  await assert.rejects(run(fetchImpl, { attempts: 2 }),
    /\.NET asset loader \(\/_framework\/dotnet\.test\.js\) failed after 2 attempts: generated \.NET resource metadata does not list a native WebAssembly runtime/);
  assert.equal(calls.get("/_framework/dotnet.test.js"), 2);
});

test("rejects invalid PNG signatures", async () => {
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/Content/identity.png": url => makeResponse(url, "not a PNG", "image/png")
    }
  });

  await assert.rejects(run(fetchImpl, { attempts: 2 }),
    /image for menu item identity \(\/Content\/identity\.png\) failed after 2 attempts: image for menu item identity has an invalid PNG signature/);
  assert.equal(calls.get("/Content/identity.png"), 2);
});

test("rejects an application root fallback served as an HTML content fragment", async () => {
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/content/identity.html": url => makeResponse(url, rootDocument, "text/html")
    }
  });

  await assert.rejects(run(fetchImpl, { attempts: 2 }),
    /content for menu item identity \(\/content\/identity\.html\) failed after 2 attempts: content for menu item identity returned the application's root fallback document/);
  assert.equal(calls.get("/content/identity.html"), 2);
});

test("reports an incorrect expected deployment revision after bounded retries", async () => {
  const { fetchImpl, calls } = createFetch({ revisions: [previousRevision] });

  await assert.rejects(run(fetchImpl, { attempts: 2 }),
    new RegExp(`deployment revision marker \\(\\/deployment-revision\\.txt\\) failed after 2 attempts: expected ${expectedRevision}, received ${previousRevision}`));
  assert.equal(calls.get("/deployment-revision.txt"), 2);
});

test("does not retry unsafe paths", async () => {
  const unsafeMenu = {
    ...menu,
    items: menu.items.map(item => item.id === "identity"
      ? { ...item, image: { src: "../escape.png" } }
      : item)
  };
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/menu.json": url => makeResponse(url, JSON.stringify(unsafeMenu), "application/json")
    }
  });

  await assert.rejects(run(fetchImpl, { attempts: 3 }),
    /image for menu item identity must be a safe same-origin static path: \.\.\/escape\.png/);
  assert.equal(calls.get("/menu.json"), 1);
  assert.equal(calls.has("/../escape.png"), false);
});

test("rejects unexpected redirects without retrying", async () => {
  const { fetchImpl, calls } = createFetch({
    overrides: {
      "/": url => makeResponse(url, rootDocument, "text/html", {
        finalUrl: "https://unexpected.example/"
      })
    }
  });

  await assert.rejects(run(fetchImpl, { attempts: 3 }),
    /HTTPS root document \(\/\) failed after 1 attempt: redirected to unexpected origin https:\/\/unexpected\.example/);
  assert.equal(calls.get("/"), 1);
});
