import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const menuPath = path.join(repositoryRoot, "src/OakIdeas.Github.Website.Client/wwwroot/menu.json");
const verifierPath = path.join(repositoryRoot, "scripts/verify-static-artifact.mjs");
const deploymentRevision = "a".repeat(40);
const wasmSignature = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function runVerifier(editMenu = () => {}, extraFile = null, revision = deploymentRevision,
  editRuntimeMetadata = () => {}) {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), "oakideas-artifact-test-"));
  try {
    const menu = JSON.parse(await readFile(menuPath, "utf8"));
    editMenu(menu);

    await writeFile(path.join(artifactRoot, "CNAME"), "www.oakideas.com\n");
    await writeFile(path.join(artifactRoot, ".nojekyll"), "");
    await writeFile(path.join(artifactRoot, "deployment-revision.txt"), `${revision}\n`);
    await mkdir(path.join(artifactRoot, "css"), { recursive: true });
    await writeFile(path.join(artifactRoot, "css/app.css"), "");
    const metadata = {
      mainAssemblyName: "OakIdeas.Github.Website.Client",
      resources: {
        wasmNative: [{ name: "dotnet.native.test.wasm" }],
        assembly: [{
          virtualPath: "OakIdeas.Github.Website.Client.wasm",
          name: "OakIdeas.Github.Website.Client.test.wasm"
        }]
      }
    };
    editRuntimeMetadata(metadata);
    const imports = Object.fromEntries(
      ["dotnet.js", "dotnet.native.js", "dotnet.runtime.js"].map(name => [`./_framework/${name}`, `./_framework/${name}`]));
    await writeFile(path.join(artifactRoot, "index.html"),
      `<base href="/"><script type="importmap">${JSON.stringify({ imports })}</script>` +
      '<script src="_framework/blazor.webassembly.js"></script>');
    await mkdir(path.join(artifactRoot, "_framework"), { recursive: true });
    await writeFile(path.join(artifactRoot, "_framework/blazor.webassembly.js"), "");
    for (const asset of ["dotnet.js", "dotnet.native.js", "dotnet.runtime.js"]) {
      await writeFile(path.join(artifactRoot, "_framework", asset), "");
    }
    await writeFile(path.join(artifactRoot, "_framework/dotnet.js"),
      `/*json-start*/${JSON.stringify(metadata)}/*json-end*/`);
    for (const asset of [metadata.resources.wasmNative[0]?.name, metadata.resources.assembly[0]?.name].filter(Boolean)) {
      await writeFile(path.join(artifactRoot, "_framework", asset), wasmSignature);
    }
    await writeFile(path.join(artifactRoot, "menu.json"), JSON.stringify(menu));

    for (const item of menu.items) {
      const imagePath = path.join(artifactRoot, item.image.src);
      await mkdir(path.dirname(imagePath), { recursive: true });
      await writeFile(imagePath, pngSignature);

      if (item.action.type === "content") {
        const contentPath = path.join(artifactRoot, item.action.contentPath);
        await mkdir(path.dirname(contentPath), { recursive: true });
        await writeFile(contentPath, "<p>Test fragment</p>");
      }
    }

    if (extraFile) {
      const extraPath = path.join(artifactRoot, extraFile);
      await mkdir(path.dirname(extraPath), { recursive: true });
      await writeFile(extraPath, "");
    }

    return spawnSync(process.execPath, [verifierPath, artifactRoot], { encoding: "utf8" });
  } finally {
    await rm(artifactRoot, { recursive: true, force: true });
  }
}

test("accepts the checked-in menu and case-insensitive file extensions", async () => {
  const result = await runVerifier(menu => {
    menu.items[1].action.contentPath = "content/identity.HTML";
    menu.items[1].image.src = "Content/mateusthoughtful.PNG";
    delete menu.items[0].enabled;
    delete menu.items[0].order;
  });

  assert.equal(result.status, 0, result.stderr);
});

test("rejects percent-encoded paths", async () => {
  const result = await runVerifier(menu => {
    menu.items[1].action.contentPath = "content/%2e%2e/identity.html";
  });

  assert.notEqual(result.status, 0);
});

test("rejects obsolete legacy resources in the published artifact", async () => {
  const result = await runVerifier(() => {}, "Content/bootstrap.css");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Obsolete or development file must not be published/);
});

test("rejects repository documentation in the published artifact", async () => {
  const result = await runVerifier(() => {}, "README.md");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Development source must not be published/);
});

test("requires a valid deployment revision marker", async () => {
  const result = await runVerifier(() => {}, null, "not-a-commit");

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /40-character source commit deployment revision/);
});

test("requires native runtime metadata and both WebAssembly binaries", async () => {
  const result = await runVerifier(() => {}, null, deploymentRevision, metadata => {
    metadata.resources.wasmNative = [];
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /native WebAssembly runtime/);
});

test("rejects credentialed external URLs", async () => {
  const result = await runVerifier(menu => {
    const url = new URL("https://example.com");
    url.username = "demo";
    url.password = "sample";
    menu.items[0].action = { type: "url", url: url.href };
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must not include credentials/);
});

for (const field of ["id", "title", "subtitle", "image.alt"]) {
  test(`rejects whitespace-only ${field}`, async () => {
    const result = await runVerifier(menu => {
      const item = menu.items[1];
      if (field === "image.alt") {
        item.image.alt = " \t\n";
      } else {
        item[field] = " \t\n";
      }
    });

    assert.notEqual(result.status, 0);
  });
}
