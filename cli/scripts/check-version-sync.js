#!/usr/bin/env node
/**
 * Refuse to publish a CLI whose version disagrees with the registry it ships.
 *
 * The package embeds a snapshot of components.json, so `components-skill@1.2.0`
 * claiming to be v1.2.0 while carrying v1.1.1 data is a lie that nobody can spot
 * from the outside. Wired into prepublishOnly rather than prepack, so a plain
 * `npm pack --dry-run` in CI stays cheap.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf8"));
const registry = JSON.parse(readFileSync(join(HERE, "..", "..", "components.json"), "utf8"));

const pkgVersion = pkg.version;
const dataVersion = registry.meta.version;

if (pkgVersion !== dataVersion) {
  console.error(
    `version drift:\n` +
      `  cli/package.json     ${pkgVersion}\n` +
      `  components.json meta ${dataVersion}\n\n` +
      `Set them to the same value before publishing.`,
  );
  process.exit(1);
}

console.log(`version sync OK: ${pkgVersion}`);
