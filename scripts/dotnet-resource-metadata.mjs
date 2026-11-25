export function parseDotnetResourceMetadata(source) {
  const metadataMatch = source.match(/\/\*json-start\*\/([\s\S]*?)\/\*json-end\*\//);
  if (!metadataMatch) {
    throw new Error("generated .NET loader is missing its embedded resource metadata");
  }

  let metadata;
  try {
    metadata = JSON.parse(metadataMatch[1]);
  } catch (error) {
    throw new Error(`generated .NET resource metadata is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  const resources = metadata?.resources;
  const nativeRuntime = Array.isArray(resources?.wasmNative)
    ? resources.wasmNative.find(resource => isWasmName(resource?.name))
    : undefined;
  if (!nativeRuntime) {
    throw new Error("generated .NET resource metadata does not list a native WebAssembly runtime");
  }

  const mainAssemblyName = metadata?.mainAssemblyName;
  if (typeof mainAssemblyName !== "string" || mainAssemblyName.length === 0) {
    throw new Error("generated .NET resource metadata does not identify the main managed assembly");
  }

  const mainAssembly = Array.isArray(resources?.assembly)
    ? resources.assembly.find(resource => resource?.virtualPath === `${mainAssemblyName}.wasm` &&
      isWasmName(resource?.name))
    : undefined;
  if (!mainAssembly) {
    throw new Error(`generated .NET resource metadata does not list the main managed assembly ${mainAssemblyName}.wasm`);
  }

  return {
    mainAssemblyName,
    nativeRuntime: nativeRuntime.name,
    mainAssembly: mainAssembly.name
  };
}

function isWasmName(value) {
  return typeof value === "string" && /^[A-Za-z0-9._-]+\.wasm$/i.test(value);
}
