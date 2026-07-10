import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runTolkCompiler } from "@ton/tolk-js";

const EXPECTED_CODE_HASH = "3C36374EB259F4619BF75C3DAFCA3B323F9AB799B1BC2F19008EBCAE94C7DFBC";
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const root = path.resolve(currentDirectory, "..");
  const result = await runTolkCompiler({
    entrypointFileName: "contracts/shore_claim.tolk",
    optimizationLevel: 2,
    withStackComments: true,
    withSrcLineComments: true,
    experimentalOptions: "",
    fsReadCallback(filename) {
      return fs.readFileSync(path.join(root, filename), "utf8");
    },
  });

  if (result.status !== "ok") {
    process.stderr.write(`${result.message || result.stderr || "Tolk compilation failed."}\n`);
    process.exitCode = 1;
    return;
  }

  if (result.codeHashHex !== EXPECTED_CODE_HASH) {
    process.stderr.write(
      [
        "SHORE claim contract code hash changed.",
        `Expected: ${EXPECTED_CODE_HASH}`,
        `Actual:   ${result.codeHashHex}`,
        "Review the contract change and intentionally update EXPECTED_CODE_HASH.",
        "",
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  const outputDir = path.join(root, "build");
  fs.mkdirSync(outputDir, { recursive: true });
  const artifact = {
    contract: "ShoreClaim",
    language: "tolk",
    compiler: "@ton/tolk-js",
    codeHashHex: result.codeHashHex,
    codeBoc64: result.codeBoc64,
    sourceFiles: result.sourcesSnapshot.map(({ filename }) => filename).sort(),
  };
  fs.writeFileSync(
    path.join(outputDir, "ShoreClaim.compiled.json"),
    `${JSON.stringify(artifact, null, 2)}\n`,
  );
  process.stdout.write(
    `SHORE claim contract compiled: ${result.codeHashHex} (${result.codeBoc64.length} base64 chars)\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
