#!/usr/bin/env node
/**
 * Fetch the gallery's curated showpieces from their real registries, at build time.
 *
 * This deliberately dogfoods the model the whole skill is built on: the repo
 * stores pointers, and the component is pulled live. Hand-copying the code into
 * gallery/src would make the gallery a vendored snapshot - exactly the thing
 * ATTRIBUTION.md says this project does not do, and it would silently go stale.
 *
 * Fetched files land in src/components/ and are gitignored.
 *
 *   node scripts/fetch-showpieces.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GALLERY = join(HERE, "..");
const REPO = join(GALLERY, "..");

/**
 * Exactly one showpiece per source library. Kept small on purpose: this is a
 * shop window, not a catalogue. Rendering all 39 would mean five WebGL contexts
 * and a multi-megabyte bundle, and every extra entry is another upstream that
 * can break the deploy.
 */
const CURATED = ["3d-card", "marquee", "texture-card", "blur-text", "matrix-text"];

/** Same allowlist discipline as scripts/smoke-test.mjs: refs are data, not commands. */
const ALLOWED_HOSTS = new Set([
  "ui.aceternity.com",
  "magicui.design",
  "www.cult-ui.com",
  "reactbits.dev",
  "kokonutui.com",
  "21st.dev",
]);

/** Keep in sync with KNOWN_ISSUES in scripts/health-check.py. */
const KNOWN_BLOCKED = {
  "www.cult-ui.com":
    "cult-ui.com serves a Vercel security challenge to every non-browser client (#31)",
};

const NPX =
  process.platform === "win32"
    ? { file: process.execPath, prefix: [join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")] }
    : { file: "npx", prefix: [] };

function parseRef(ref) {
  const m = /^npx\s+shadcn@latest\s+add\s+"([^"]+)"\s*$/.exec((ref || "").trim());
  if (!m) return { error: "not a runnable registry command" };
  let url;
  try {
    url = new URL(m[1]);
  } catch {
    return { error: `unparseable URL: ${m[1]}` };
  }
  if (url.protocol !== "https:") return { error: `not https: ${url.href}` };
  if (!ALLOWED_HOSTS.has(url.hostname)) return { error: `host not allowlisted: ${url.hostname}` };
  return { url };
}

function main() {
  const registry = JSON.parse(readFileSync(join(REPO, "components.json"), "utf8"));
  const byName = new Map(registry.showpiece.map((e) => [e.name, e]));

  mkdirSync(join(GALLERY, "src", "components"), { recursive: true });

  const status = [];
  for (const name of CURATED) {
    const entry = byName.get(name);
    if (!entry) {
      console.error(`Curated entry '${name}' is not in components.json showpiece[].`);
      process.exit(1);
    }

    const host = (() => {
      const m = /https?:\/\/([^/\s"']+)/.exec(entry.ref || "");
      return m ? m[1] : null;
    })();

    if (host && KNOWN_BLOCKED[host]) {
      // Not a build failure. The gallery renders an honest placeholder card
      // instead, which is more useful than either a red deploy or a silent gap.
      console.log(`skip  ${entry.library}/${name}: ${KNOWN_BLOCKED[host]}`);
      status.push({ ...pick(entry), available: false, reason: KNOWN_BLOCKED[host] });
      continue;
    }

    const parsed = parseRef(entry.ref);
    if (parsed.error) {
      console.log(`skip  ${entry.library}/${name}: ${parsed.error}`);
      status.push({ ...pick(entry), available: false, reason: parsed.error });
      continue;
    }

    try {
      console.log(`fetch ${entry.library}/${name} -> ${parsed.url.href}`);
      execFileSync(NPX.file, [...NPX.prefix, "--yes", "shadcn@latest", "add", parsed.url.href, "--yes", "--overwrite"], {
        cwd: GALLERY,
        stdio: "pipe",
        encoding: "utf8",
        env: { ...process.env, CI: "1" },
      });
      status.push({ ...pick(entry), available: true });
    } catch (err) {
      const msg = (err.stderr || err.stdout || err.message || "").toString().trim().split("\n").slice(-3).join(" ");
      console.log(`skip  ${entry.library}/${name}: fetch failed - ${msg}`);
      status.push({ ...pick(entry), available: false, reason: "upstream fetch failed" });
    }
  }

  // The app reads this to know what actually made it in, so a blocked upstream
  // degrades to a placeholder rather than a broken import.
  writeFileSync(
    join(GALLERY, "src", "showpieces.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), entries: status }, null, 2) + "\n",
  );

  const ok = status.filter((s) => s.available).length;
  console.log(`\n${ok}/${status.length} showpieces fetched.`);
}

function pick(e) {
  return {
    name: e.name,
    library: e.library,
    effect: e.effect,
    aliases: e.aliases,
    license: e.license,
    deps: e.deps ?? [],
    ref: e.ref,
  };
}

main();
