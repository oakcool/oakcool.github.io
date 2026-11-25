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

async function runVerifier(editMenu = () => {}, extraFile = null) {
  const artifactRoot = await mkdtemp(path.join(os.tmpdir(), "oakideas-artifact-test-"));
  try {
    const menu = JSON.parse(await readFile(menuPath, "utf8"));
    editMenu(menu);

    await writeFile(path.join(artifactRoot, "CNAME"), "www.oakideas.com\n");
    await writeFile(path.join(artifactRoot, ".nojekyll"), "");
    await mkdir(path.join(artifactRoot, "css"), { recursive: true });
    await writeFile(path.join(artifactRoot, "css/app.css"), "");
    const runtimeAssets = ["dotnet.js", "dotnet.native.js", "dotnet.runtime.js"];
    const imports = Object.fromEntries(runtimeAssets.map(name => [`./_framework/${name}`, `./_framework/${name}`]));
    await writeFile(path.join(artifactRoot, "index.html"),
      `<base href="/"><script type="importmap">${JSON.stringify({ imports })}</script>` +
      '<script src="_framework/blazor.webassembly.js"></script>');
    await mkdir(path.join(artifactRoot, "_framework"), { recursive: true });
    await writeFile(path.join(artifactRoot, "_framework/blazor.webassembly.js"), "");
    for (const asset of runtimeAssets) {
      await writeFile(path.join(artifactRoot, "_framework", asset), "");
    }
    await writeFile(path.join(artifactRoot, "menu.json"), JSON.stringify(menu));

    for (const item of menu.items) {
      const imagePath = path.join(artifactRoot, item.image.src);
      await mkdir(path.dirname(imagePath), { recursive: true });
      await writeFile(imagePath, "");

      if (item.action.type === "content") {
        const contentPath = path.join(artifactRoot, item.action.contentPath);
        await mkdir(path.dirname(contentPath), { recursive: true });
        await writeFile(contentPath, "");
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
