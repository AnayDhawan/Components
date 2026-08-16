#!/usr/bin/env node
/**
 * Registry smoke test: prove a sample of `ref` commands actually resolve and
 * compile on a genuinely fresh project.
 *
 * validate.py checks that the data is well-formed. This checks that the data is
 * *true* - that the command in a `ref` field still pulls real code into a real
 * Vite + React + TS + Tailwind project and that the result builds.
 *
 *   node scripts/smoke-test.mjs            # hard-fail (PR gate), curated sample
 *   node scripts/smoke-test.mjs --soft     # report only, always exit 0 (schedule)
 *   node scripts/smoke-test.mjs --only marquee
 *   node scripts/smoke-test.mjs --diff <base-sha>   # only entries new/changed since <base-sha>
 *
 * Each entry gets its own throwaway project in a temp dir, which is deleted
 * afterwards unless --keep is passed.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * A FIXED, CURATED sample: one entry per source library, chosen by hand.
 *
 * Deliberately not "the first N entries" and not a random sample. This job runs
 * on every PR that touches components.json, so it has to be boring and stable:
 * a random sample makes CI flaky for reasons unrelated to the change under
 * review, and "first N" silently re-scopes itself whenever someone reorders the
 * array.
 *
 * Selection rules for anything added here:
 *  - one per library, so a whole registry going down is one clear failure;
 *  - cheapest dependency footprint available in that library (no WebGL, no
 *    three/ogl/gsap), because this installs from scratch five times per run;
 *  - a long-lived, popular entry unlikely to be renamed upstream.
 *
 * The other 34 entries are covered by scripts/health-check.py on a schedule,
 * which pings every ref but does not compile anything.
 */
const SAMPLE = [
  "3d-card",      // aceternity - deps: motion
  "marquee",      // magicui    - deps: motion
  "texture-card", // cult-ui    - deps: none
  "blur-text",    // reactbits  - deps: motion
  "matrix-text",  // 21st.dev   - via the kokonutui.com open mirror, no auth
];

/**
 * Hosts known to be blocked for automated clients, with the tracking issue.
 * These are reported as SKIP, never FAIL: the whole point of the PR gate is to
 * catch a contributor's broken ref, and failing their PR because a third party
 * turned on bot protection teaches everyone to ignore the job.
 *
 * Keep in sync with KNOWN_ISSUES in scripts/health-check.py.
 */
const KNOWN_BLOCKED = {
  "www.cult-ui.com":
    "Vercel Attack Challenge Mode returns HTTP 429 to every non-browser client (#31)",
};

/**
 * Registry hosts this job is willing to execute a fetch against.
 *
 * `ref` is contributor-editable data and this job runs on pull_request, so a ref
 * is treated as untrusted input: it is parsed into an explicit argv (never
 * handed to a shell) and its host must appear here. Mirrors the allowlist in
 * references/live-fetch.md § Safety.
 */
const ALLOWED_HOSTS = new Set([
  "ui.aceternity.com",
  "magicui.design",
  "www.cult-ui.com",
  "reactbits.dev",
  "kokonutui.com",
  "21st.dev",
]);

/**
 * Parse `npx shadcn@latest add "<url>"` into an argv, rejecting anything else.
 *
 * Returns { argv } or { error }. Deliberately strict: the point is that no part
 * of a contributed string can reach a shell, so this refuses to be clever about
 * unusual forms rather than trying to accommodate them.
 */
function parseRef(ref) {
  const m = /^npx\s+shadcn@latest\s+add\s+"([^"]+)"\s*$/.exec((ref || "").trim());
  if (!m) return { error: "ref is not a plain `npx shadcn@latest add \"<url>\"` command" };

  let url;
  try {
    url = new URL(m[1]);
  } catch {
    return { error: `ref URL is unparseable: ${m[1]}` };
  }
  if (url.protocol !== "https:") return { error: `ref URL is not https: ${url.href}` };
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    return { error: `ref host '${url.hostname}' is not in the smoke-test allowlist` };
  }
  return { argv: ["shadcn@latest", "add", url.href, "--yes"], url };
}

const args = process.argv.slice(2);
const SOFT = args.includes("--soft");
const KEEP = args.includes("--keep");
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const DIFF_BASE = args.includes("--diff") ? args[args.indexOf("--diff") + 1] : null;

const log = (...m) => console.log(...m);
const group = (t) => log(`\n${"=".repeat(70)}\n${t}\n${"=".repeat(70)}`);

const CHILD_ENV = { ...process.env, CI: "1", ADBLOCK: "1", DISABLE_OPENCOLLECTIVE: "1" };

/**
 * Resolve npm/npx to something runnable with shell:false on every platform.
 *
 * On Windows `npm` is a .cmd shim, and since the fix for CVE-2024-27980 Node
 * refuses to spawn .cmd without shell:true. Turning the shell back on would undo
 * the whole point of parsing refs into an argv, so instead we run npm's own JS
 * entrypoint under the current node binary. On POSIX the plain name is fine.
 */
function resolveNpmBin(name) {
  if (process.platform !== "win32") return { file: name, prefix: [] };
  const js = join(dirname(process.execPath), "node_modules", "npm", "bin", `${name}-cli.js`);
  if (existsSync(js)) return { file: process.execPath, prefix: [js] };
  // Fall back to the shim. Refs are still validated against ALLOWED_HOSTS and
  // parsed to a URL before they get anywhere near this.
  return { file: `${name}.cmd`, prefix: [], shell: true };
}

const NPM = resolveNpmBin("npm");
const NPX = resolveNpmBin("npx");

/** Run a command as an explicit argv. No shell, except the Windows fallback above. */
function run(bin, argv, cwd) {
  return execFileSync(bin.file, [...bin.prefix, ...argv], {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    env: CHILD_ENV,
    shell: Boolean(bin.shell),
  });
}

function listFiles(dir) {
  const out = new Set();
  const walk = (d) => {
    let entries;
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e === "node_modules" || e === ".git") continue;
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else out.add(relative(dir, p));
    }
  };
  walk(dir);
  return out;
}

/**
 * A fresh Vite + React + TS project with Tailwind v4 and shadcn wired up.
 * Registry commands require a shadcn-initialised project (components.json, the
 * cn() util, and the @/* path alias), which is exactly the state the README
 * tells users they need, so setting it up here keeps the test honest.
 */
function setupProject(dir) {
  run(NPM, ["create", "vite@latest", "app", "--", "--template", "react-ts"], dir);
  const app = join(dir, "app");

  run(NPM, ["install", "--no-audit", "--no-fund"], app);
  run(NPM, ["install", "tailwindcss", "@tailwindcss/vite", "--no-audit", "--no-fund"], app);
  run(NPM, ["install", "-D", "@types/node", "--no-audit", "--no-fund"], app);

  writeFileSync(join(app, "src", "index.css"), `@import "tailwindcss";\n`);

  // shadcn resolves "@/..." imports through these, and refuses to init without them.
  writeFileSync(
    join(app, "tsconfig.json"),
    JSON.stringify(
      {
        files: [],
        references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }],
        // No baseUrl: TS 7 deprecates it, and paths resolve relative to this
        // file without it. shadcn only needs the alias to exist.
        compilerOptions: { paths: { "@/*": ["./src/*"] } },
      },
      null,
      2,
    ),
  );
  const appTs = JSON.parse(
    readFileSync(join(app, "tsconfig.app.json"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
  );
  appTs.compilerOptions = { ...appTs.compilerOptions, paths: { "@/*": ["./src/*"] } };
  delete appTs.compilerOptions.baseUrl;

  // Vite's react-ts template turns these on. They are lint preferences, not
  // correctness: several upstream showpieces ship unused event params (e.g.
  // aceternity/3d-card) and would fail here for style reasons that say nothing
  // about whether the ref works. The question this job asks is "does the fetched
  // code compile and bundle in a real project", and a real project picks its own
  // strictness. Genuine type errors - bad imports, wrong types - still fail.
  appTs.compilerOptions.noUnusedLocals = false;
  appTs.compilerOptions.noUnusedParameters = false;
  writeFileSync(join(app, "tsconfig.app.json"), JSON.stringify(appTs, null, 2));

  writeFileSync(
    join(app, "vite.config.ts"),
    `import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
`,
  );

  run(NPX, ["--yes", "shadcn@latest", "init", "--defaults", "--yes"], app);
  return app;
}

function checkReducedMotion(app, added) {
  // Upstream's code, not this repo's data, so this can only ever be a warning.
  const sources = [...added].filter((f) => /\.(tsx?|jsx?|css)$/.test(f));
  const hits = [];
  for (const f of sources) {
    let text;
    try {
      text = readFileSync(join(app, f), "utf8");
    } catch {
      continue;
    }
    if (/useReducedMotion|motion-reduce:|prefers-reduced-motion/.test(text)) hits.push(f);
  }
  return { checked: sources.length, hits };
}

function smokeTest(entry) {
  const host = (() => {
    const m = /https?:\/\/([^/\s"']+)/.exec(entry.ref || "");
    return m ? m[1] : null;
  })();

  if (host && KNOWN_BLOCKED[host]) {
    return { name: entry.name, status: "skip", detail: KNOWN_BLOCKED[host] };
  }
  if (!/^npx\s/.test(entry.ref || "")) {
    return {
      name: entry.name,
      status: "skip",
      detail: "ref is a page-fetch instruction, not a runnable command",
    };
  }

  const parsed = parseRef(entry.ref);
  if (parsed.error) {
    // A malformed or off-allowlist ref is a real failure: either the data is
    // wrong, or something is trying to run a command this job will not run.
    return { name: entry.name, status: "fail", detail: parsed.error };
  }

  const tmp = mkdtempSync(join(tmpdir(), `components-smoke-${entry.name}-`));
  try {
    const app = setupProject(tmp);
    const before = listFiles(join(app, "src"));

    log(`  $ npx ${parsed.argv.join(" ")}`);
    run(NPX, ["--yes", ...parsed.argv], app);

    const after = listFiles(join(app, "src"));
    const added = [...after].filter((f) => !before.has(f));
    if (added.length === 0) {
      return { name: entry.name, status: "fail", detail: "ref ran but wrote no files into src/" };
    }
    log(`  + ${added.length} file(s): ${added.join(", ")}`);

    run(NPM, ["run", "build"], app);

    const motion = checkReducedMotion(app, added);
    return {
      name: entry.name,
      status: "pass",
      added,
      motion,
      detail: `${added.length} file(s), build OK`,
    };
  } catch (err) {
    const msg = (err.stderr || err.stdout || err.message || "").toString().trim().split("\n").slice(-12).join("\n");
    return { name: entry.name, status: "fail", detail: msg || String(err) };
  } finally {
    if (!KEEP) rmSync(tmp, { recursive: true, force: true });
    else log(`  kept: ${tmp}`);
  }
}

/**
 * Names of showpiece entries that are new, or whose `ref` changed, versus
 * `base`. This is the actual claim a PR touching components.json makes ("this
 * ref works"), as opposed to SAMPLE, which is a fixed regression baseline
 * unrelated to what the PR changed.
 *
 * Renames, alias/license/effect edits, and fallback_basic changes are not
 * "new/changed" here: none of them touch what gets live-fetched, so re-running
 * the fetch+build would test something the PR didn't actually claim.
 */
function changedShowpieceNames(base, headData) {
  let baseJson;
  try {
    const raw = execFileSync("git", ["show", `${base}:components.json`], {
      cwd: ROOT,
      encoding: "utf8",
    });
    baseJson = JSON.parse(raw);
  } catch (err) {
    // components.json is new in this PR, or `base` isn't reachable (e.g. a
    // shallow checkout): nothing to diff against, so every showpiece with a
    // ref is "new" relative to that base.
    log(`Could not read components.json at ${base} (${String(err.message).split("\n")[0]}); treating all showpiece entries as new.`);
    return headData.showpiece.filter((e) => e.ref).map((e) => e.name);
  }

  const baseByName = new Map((baseJson.showpiece || []).map((e) => [e.name, e]));
  const changed = [];
  for (const e of headData.showpiece) {
    if (!e.ref) continue;
    const prev = baseByName.get(e.name);
    if (!prev || prev.ref !== e.ref) changed.push(e.name);
  }
  return changed;
}

function main() {
  const data = JSON.parse(readFileSync(join(ROOT, "components.json"), "utf8"));
  const byName = new Map(data.showpiece.map((e) => [e.name, e]));

  let wanted;
  let modeLabel;
  if (DIFF_BASE) {
    wanted = changedShowpieceNames(DIFF_BASE, data);
    modeLabel = "new/changed";
    if (wanted.length === 0) {
      log(`No new or changed showpiece entries versus ${DIFF_BASE}. Nothing to smoke-test.`);
      if (process.env.GITHUB_STEP_SUMMARY) {
        writeFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          "# Registry smoke test (new/changed entries)\n\nNo new or changed showpiece entries in this PR.\n\n",
          { flag: "a" },
        );
      }
      return 0;
    }
  } else if (ONLY) {
    wanted = [ONLY];
    modeLabel = "selected";
  } else {
    wanted = SAMPLE;
    modeLabel = "curated";
  }

  const entries = [];
  for (const name of wanted) {
    const e = byName.get(name);
    if (!e) {
      // SAMPLE/ONLY name a specific entry by hand, so a miss must break loudly
      // rather than silently shrink what gets tested. --diff never hits this:
      // its names always come straight from data.showpiece.
      console.error(`Entry '${name}' is not in components.json showpiece[].`);
      console.error(`Update SAMPLE in scripts/smoke-test.mjs if the entry was renamed or removed.`);
      process.exit(1);
    }
    entries.push(e);
  }

  log(`Smoke-testing ${entries.length} ${modeLabel} entr${entries.length === 1 ? "y" : "ies"}`);
  log(`Mode: ${SOFT ? "soft (report only)" : "hard (blocks merge)"}`);

  const results = [];
  for (const e of entries) {
    group(`${e.library}/${e.name}`);
    const r = smokeTest(e);
    results.push({ ...r, library: e.library });
    log(`  -> ${r.status.toUpperCase()}: ${r.detail}`);
  }

  group("Summary");
  const rows = ["| Entry | Library | Result | Detail |", "|---|---|---|---|"];
  const warnings = [];
  for (const r of results) {
    const icon = { pass: "PASS", fail: "FAIL", skip: "SKIP" }[r.status];
    let detail = r.detail.replace(/\|/g, "\\|").replace(/\n/g, " ");
    if (detail.length > 160) detail = detail.slice(0, 157) + "...";
    rows.push(`| \`${r.name}\` | ${r.library} | **${icon}** | ${detail} |`);
    log(`${icon.padEnd(5)} ${r.library}/${r.name}`);

    if (r.status === "pass" && r.motion && r.motion.hits.length === 0 && r.motion.checked > 0) {
      const w = `\`${r.name}\`: no useReducedMotion / motion-reduce: / prefers-reduced-motion in ${r.motion.checked} fetched file(s)`;
      warnings.push(w);
      log(`      warning: no reduced-motion handling found upstream`);
    }
  }

  const failed = results.filter((r) => r.status === "fail");
  const skipped = results.filter((r) => r.status === "skip");

  let md = [
    `# Registry smoke test (${modeLabel} entries)`,
    "",
    `${results.length - failed.length - skipped.length} passed, ${failed.length} failed, ${skipped.length} skipped.`,
    "",
    ...rows,
    "",
  ];
  if (warnings.length) {
    md.push(
      "## Reduced-motion warnings",
      "",
      "These check **upstream** code, not this repo's data, so they never fail the job.",
      "Adaptation is applied at use time (`references/adaptation.md`); this is a heads-up",
      "that the fetched source ships no reduced-motion handling of its own.",
      "",
      ...warnings.map((w) => `- ${w}`),
      "",
    );
  }
  md = md.join("\n");

  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, md, { flag: "a" });
  }

  log(`\n${failed.length} failure(s), ${skipped.length} skipped, ${warnings.length} warning(s).`);
  if (failed.length && !SOFT) return 1;
  return 0;
}

process.exit(main());
