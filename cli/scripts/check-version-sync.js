#!/usr/bin/env node
/**
 * Refuse to publish a CLI whose version disagrees with components.json's
 * meta.version, or with the other places that same version string is
 * duplicated by hand (gallery/package.json, the README status badge).
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
const ROOT = join(HERE, "..", "..");

const registry = JSON.parse(readFileSync(join(ROOT, "components.json"), "utf8"));
const dataVersion = registry.meta.version;

const cliPkg = JSON.parse(readFileSync(join(ROOT, "cli", "package.json"), "utf8"));
const galleryPkg = JSON.parse(readFileSync(join(ROOT, "gallery", "package.json"), "utf8"));
const readme = readFileSync(join(ROOT, "README.md"), "utf8");
const badgeMatch = readme.match(/status-v([0-9.]+)-brightgreen/);

const pairings = [
  ["cli/package.json", cliPkg.version],
  ["gallery/package.json", galleryPkg.version],
  ["README.md status badge", badgeMatch ? badgeMatch[1] : null],
];

const mismatches = pairings.filter(([, version]) => version !== dataVersion);

if (mismatches.length > 0) {
  console.error(
    `version drift (components.json meta.version is ${dataVersion}):\n` +
      mismatches
        .map(([label, version]) => `  ${label.padEnd(24)} ${version ?? "(not found)"}`)
        .join("\n") +
      `\n\nSet them all to the same value before publishing.`,
  );
  process.exit(1);
}

console.log(`version sync OK: ${dataVersion}`);
