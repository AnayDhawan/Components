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
 *   node scripts/smoke-test.mjs --only split-text --framework vue   # a frameworks.<name> variant
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
 * Entries whose upstream source ships unused event params (TS6133 under
 * Vite's default react-ts template's `noUnusedParameters`). Scoped here
 * instead of relaxing the check for every entry, so a genuinely broken import
 * or type error in some *other* entry still fails loudly. Add an entry here
 * only after confirming by hand that the failure is exactly this lint, not a
 * real type error - see #44.
 */
const NEEDS_RELAXED_STRICTNESS = new Set(["3d-card"]);

/**
 * Hosts known to be blocked for automated clients, with the tracking issue.
 * These are reported as SKIP, never FAIL: the whole point of the PR gate is to
 * catch a contributor's broken ref, and failing their PR because a third party
 * turned on bot protection teaches everyone to ignore the job.
 *
 * Sourced from components.json's own `known_issues[]`, the same array
 * scripts/health-check.py and gallery/scripts/fetch-showpieces.mjs read - one
 * place to update instead of three hand-maintained copies.
 */
function knownBlockedHosts(data) {
  const out = {};
  for (const rec of data.known_issues ?? []) {
    out[rec.host] = `${rec.why} (#${rec.issue})`;
  }
  return out;
}

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
  "vue-bits.dev",
  "sveltebits.xyz",
  // inspira-ui.com 307-redirects registry items to registry.inspira-ui.com, so both
  // the documented host and the one the fetch actually lands on must be allowed.
  "inspira-ui.com",
  "registry.inspira-ui.com",
]);

/**
 * Which project setup a framework variant needs, independent of the CLI its ref
 * invokes.
 *
 * These are not the same axis. Svelte Bits documents installation through plain
 * `shadcn` with a direct URL, not through a `shadcn-svelte` CLI, so CLI_SETUP
 * would resolve its refs to a React project and fail them for the wrong reason.
 * A framework listed here with a setup this file does not implement is reported
 * as SKIP, not FAIL: the data is fine, the harness just cannot compile it yet.
 */
const FRAMEWORK_SETUP = {
  vue: "vue",
  svelte: null, // no SvelteKit + shadcn project builder here yet
};

/**
 * A conservative npm package name: optional `@scope/`, then lowercase name.
 *
 * `deps` is contributor-editable data on a job that runs on pull_request, same
 * threat model as `ref`. Entries are free-text by design (some read "motion
 * (framer-motion)" or "varies per component"), so anything that is not
 * unambiguously a package name is reported and skipped rather than handed to
 * `npm install`. No leading dash, so a value can never be read as a flag.
 */
const NPM_PACKAGE_NAME = /^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

/**
 * CLI packages a ref is allowed to invoke, and which project setup each needs.
 * Framework-variant refs (components.json `frameworks.<name>`) use the same
 * shadcn registry-item schema as the React ones, just through that framework's
 * own shadcn-family CLI, so the parser stays one regex with the package name as
 * a capture group instead of a second copy-pasted parser per framework.
 */
const CLI_SETUP = {
  "shadcn": "react",
  "shadcn-vue": "vue",
};

/**
 * Parse `npx <shadcn-family-cli>@latest add "<url>"` into an argv, rejecting
 * anything else.
 *
 * Returns { argv, setup } or { error }. Deliberately strict: the point is that
 * no part of a contributed string can reach a shell, so this refuses to be
 * clever about unusual forms rather than trying to accommodate them.
 */
function parseRef(fetchSpec) {
  if (!fetchSpec || typeof fetchSpec !== "object") {
    return { error: "entry has no structured `fetch` object (see CONTRIBUTING.md)" };
  }
  if (fetchSpec.method !== "registry_cli") {
    return { error: `fetch.method is '${fetchSpec.method}', not a runnable registry command` };
  }

  const cli = fetchSpec.cli;
  const setup = CLI_SETUP[cli];
  if (!setup) {
    return { error: `fetch.cli '${cli}' is not in the smoke-test allowlist (${Object.keys(CLI_SETUP).join(", ")})` };
  }

  let url;
  try {
    url = new URL(fetchSpec.url);
  } catch {
    return { error: `fetch.url is unparseable: ${fetchSpec.url}` };
  }
  if (url.protocol !== "https:") return { error: `fetch.url is not https: ${url.href}` };
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    return { error: `fetch.url host '${url.hostname}' is not in the smoke-test allowlist` };
  }
  return { argv: [`${cli}@latest`, "add", url.href, "--yes"], url, setup };
}

const args = process.argv.slice(2);
const SOFT = args.includes("--soft");
const KEEP = args.includes("--keep");
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const DIFF_BASE = args.includes("--diff") ? args[args.indexOf("--diff") + 1] : null;
const FRAMEWORK = args.includes("--framework") ? args[args.indexOf("--framework") + 1] : null;

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

/**
 * Strip whole-line `/* ... *\/` and `//` comments from a Vite template's
 * tsconfig (JSONC), so it can go through plain JSON.parse.
 *
 * Line-scoped on purpose, not a global `/\/\*[\s\S]*?\*\//` sweep: that pattern
 * also matches the literal 4 characters `/**\/` inside a JSON string like
 * `"src/**\/*.vue"` (Vue's template `include` array uses exactly that glob),
 * silently eating the rest of the array. A comment that is the entire line has
 * no such collision.
 */
function stripJsonc(text) {
  return text
    .split("\n")
    .filter((line) => !/^\s*\/\*.*\*\/\s*$/.test(line) && !/^\s*\/\/.*$/.test(line))
    .join("\n");
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
function setupProject(dir, relaxStrictness) {
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
    stripJsonc(readFileSync(join(app, "tsconfig.app.json"), "utf8")),
  );
  appTs.compilerOptions = { ...appTs.compilerOptions, paths: { "@/*": ["./src/*"] } };
  delete appTs.compilerOptions.baseUrl;

  // Vite's react-ts template turns these on. They are lint preferences, not
  // correctness, and a couple of upstream showpieces (see
  // NEEDS_RELAXED_STRICTNESS) ship unused event params that would fail here for
  // style reasons unrelated to whether the ref works. Scoped to just those
  // entries rather than every future one: a real type error - bad imports,
  // wrong types - should still fail for everything else.
  if (relaxStrictness) {
    appTs.compilerOptions.noUnusedLocals = false;
    appTs.compilerOptions.noUnusedParameters = false;
  }
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

/**
 * A fresh Vite + Vue + TS project with Tailwind v4 and shadcn-vue wired up, for
 * `frameworks.vue` refs. Same shape as setupProject, one real difference found
 * by hand: shadcn-vue's import-alias check reads the *root* tsconfig.json's
 * own `compilerOptions.paths` directly, not tsconfig.app.json's (which is what
 * shadcn/React reads via project references) - so the alias has to be written
 * to both files here, not just the app one.
 */
function setupVueProject(dir, relaxStrictness) {
  run(NPM, ["create", "vite@latest", "app", "--", "--template", "vue-ts"], dir);
  const app = join(dir, "app");

  run(NPM, ["install", "--no-audit", "--no-fund"], app);
  run(NPM, ["install", "tailwindcss", "@tailwindcss/vite", "--no-audit", "--no-fund"], app);
  run(NPM, ["install", "-D", "@types/node", "--no-audit", "--no-fund"], app);

  writeFileSync(join(app, "src", "style.css"), `@import "tailwindcss";\n`);

  writeFileSync(
    join(app, "tsconfig.json"),
    JSON.stringify(
      {
        files: [],
        references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }],
        compilerOptions: { paths: { "@/*": ["./src/*"] } },
      },
      null,
      2,
    ),
  );
  // Vue's template also ships a `/* Linting */`-style comment block, same as
  // React's, so this needs the same JSONC strip before JSON.parse.
  const appTs = JSON.parse(
    stripJsonc(readFileSync(join(app, "tsconfig.app.json"), "utf8")),
  );
  appTs.compilerOptions = { ...appTs.compilerOptions, paths: { "@/*": ["./src/*"] } };

  // Same rationale as setupProject, same scoping to NEEDS_RELAXED_STRICTNESS.
  if (relaxStrictness) {
    appTs.compilerOptions.noUnusedLocals = false;
    appTs.compilerOptions.noUnusedParameters = false;
  }
  writeFileSync(join(app, "tsconfig.app.json"), JSON.stringify(appTs, null, 2));

  writeFileSync(
    join(app, "vite.config.ts"),
    `import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
`,
  );

  run(NPX, ["--yes", "shadcn-vue@latest", "init", "--defaults", "--yes"], app);
  return app;
}

const SETUP = { react: setupProject, vue: setupVueProject };

function checkReducedMotion(app, added) {
  // Upstream's code, not this repo's data, so this can only ever be a warning.
  const sources = [...added].filter((f) => /\.(tsx?|jsx?|vue|css)$/.test(f));
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

/**
 * Diff components.json's declared `deps` against the registry item's own
 * `dependencies` array (fetched separately from the `npx ... add` call, since
 * that call installs but never surfaces the list this job wants to compare).
 * Not every registry declares `dependencies` (aceternity/magicui's registry
 * JSON often omits it even for entries with real peer deps) - silently skip
 * the check rather than reporting a false drift when it's simply absent.
 *
 * Only reports deps *declared but not found upstream* - the direction that
 * means components.json has drifted (renamed/dropped dep, typo). The reverse
 * (upstream deps not in components.json) is expected noise: entry.deps is a
 * curated "peer deps worth calling out" list, not a mirror of every package
 * the registry installs, so it will always be a subset.
 */
async function checkDeclaredDeps(url) {
  let registryDeps;
  try {
    const res = await fetch(url);
    const json = await res.json();
    registryDeps = json.dependencies;
  } catch {
    return null; // network hiccup fetching the JSON a second time - not this check's job to fail the run
  }
  if (!Array.isArray(registryDeps) || registryDeps.length === 0) return null;

  // "framer-motion@^11.0.0" -> "framer-motion"; scoped packages keep their
  // leading "@scope/" and split on the *second* "@" (version pin), if any.
  const stripVersion = (spec) => {
    const at = spec.startsWith("@") ? spec.indexOf("@", 1) : spec.indexOf("@");
    return at === -1 ? spec : spec.slice(0, at);
  };
  return new Set(registryDeps.map((d) => stripVersion(d).toLowerCase()));
}

/**
 * `framework`, if given, tests entry.frameworks[framework] (ref + library)
 * instead of the entry's top-level React ones. name/aliases/effect are always
 * the parent's - only the fetch/license surface differs per framework.
 */
async function smokeTest(entry, framework, knownBlocked) {
  let fetchSpec = entry.fetch;
  let library = entry.library;
  let declaredDeps = entry.deps ?? [];
  if (framework) {
    const variant = entry.frameworks?.[framework];
    if (!variant) {
      return { name: entry.name, status: "fail", detail: `no frameworks.${framework} entry` };
    }
    fetchSpec = variant.fetch;
    library = variant.library;
    declaredDeps = variant.deps ?? [];

    // A framework whose project setup this file does not implement is skipped
    // before anything is installed, rather than built in the wrong framework's
    // template and failed for a reason that has nothing to do with the entry.
    if (framework in FRAMEWORK_SETUP && FRAMEWORK_SETUP[framework] === null) {
      return {
        name: entry.name,
        status: "skip",
        detail: `no ${framework} project setup in smoke-test.mjs yet; ref is validated but not compiled`,
      };
    }
  }

  const host = (() => {
    try {
      return new URL(fetchSpec?.url ?? "").hostname;
    } catch {
      return null;
    }
  })();

  if (host && knownBlocked[host]) {
    return { name: entry.name, status: "skip", detail: knownBlocked[host] };
  }
  if (fetchSpec && fetchSpec.method !== "registry_cli") {
    return {
      name: entry.name,
      status: "skip",
      detail: `fetch.method is '${fetchSpec.method}': a page fetch, not a runnable command`,
    };
  }

  const parsed = parseRef(fetchSpec);
  if (parsed.error) {
    // A malformed or off-allowlist ref is a real failure: either the data is
    // wrong, or something is trying to run a command this job will not run.
    return { name: entry.name, status: "fail", detail: parsed.error };
  }

  const tmp = mkdtempSync(join(tmpdir(), `components-smoke-${entry.name}-`));
  try {
    const app = SETUP[parsed.setup](tmp, NEEDS_RELAXED_STRICTNESS.has(entry.name));
    const before = listFiles(join(app, "src"));

    log(`  $ npx ${parsed.argv.join(" ")}`);
    run(NPX, ["--yes", ...parsed.argv], app);

    const after = listFiles(join(app, "src"));
    const added = [...after].filter((f) => !before.has(f));
    if (added.length === 0) {
      return { name: entry.name, status: "fail", detail: "ref ran but wrote no files into src/" };
    }
    log(`  + ${added.length} file(s): ${added.join(", ")}`);

    // Install the entry's curated `deps` before building.
    //
    // `deps` exists to record the peer dependencies a registry item needs but
    // does not declare, and until now nothing proved those were right: the job
    // ran the registry command and built, so an entry whose only problem was a
    // missing curated dep passed. Installing them makes the build a real test of
    // the curated data, not just of upstream's. Inspira UI is the case that
    // forced this - every one of its components imports `@inspira-ui/plugins`
    // for cn(), and its registry item's `dependencies` array is empty.
    const installable = declaredDeps.filter((d) => NPM_PACKAGE_NAME.test(d));
    const rejected = declaredDeps.filter((d) => !NPM_PACKAGE_NAME.test(d));
    if (installable.length > 0) {
      log(`  $ npm install ${installable.join(" ")}`);
      run(NPM, ["install", ...installable, "--no-audit", "--no-fund"], app);
    }

    run(NPM, ["run", "build"], app);

    const motion = checkReducedMotion(app, added);
    const registryDeps = await checkDeclaredDeps(parsed.url.href);
    // A declared dep the registry does not list used to read as drift. Now that
    // the build above actually installs these and compiles, a dep in this list
    // has just been proven necessary, which is curation working, not drift. So
    // only the ones that were NOT installed (unparseable as package names, so
    // never proven either way) are worth a warning.
    const unprovenDeps = registryDeps
      ? declaredDeps.filter(
          (d) => !registryDeps.has(d.toLowerCase()) && !NPM_PACKAGE_NAME.test(d),
        )
      : [];
    return {
      name: entry.name,
      status: "pass",
      added,
      motion,
      missingDeps: unprovenDeps,
      installedDeps: installable,
      rejectedDeps: rejected,
      detail:
        `${added.length} file(s), build OK` +
        (installable.length ? `, ${installable.length} declared dep(s) installed` : "") +
        (rejected.length ? `, ${rejected.length} dep(s) not installable as written` : ""),
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
 * Names of showpiece entries that are new, or whose fetch surface changed,
 * versus `base`. This is the actual claim a PR touching components.json makes
 * ("this fetches and builds"), as opposed to SAMPLE, which is a fixed regression
 * baseline unrelated to what the PR changed.
 *
 * "Fetch surface" is `fetch` plus `deps`, since the build now installs declared
 * deps: changing a dep changes what this job would prove. Renames, alias,
 * license and effect edits, and fallback_basic changes are not "new/changed":
 * none of them touch what gets fetched or installed, so re-running the
 * fetch+build would test something the PR didn't actually claim.
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
    return headData.showpiece.filter((e) => e.fetch).map((e) => e.name);
  }

  // Compared as JSON so a reordered key or an added field still counts as a
  // change. These objects are tiny and hand-written, so this is exact enough.
  const fetchSurface = (e) => JSON.stringify([e?.fetch ?? null, e?.deps ?? []]);

  const baseByName = new Map((baseJson.showpiece || []).map((e) => [e.name, e]));
  const changed = [];
  for (const e of headData.showpiece) {
    if (!e.fetch) continue;
    const prev = baseByName.get(e.name);
    if (!prev || fetchSurface(prev) !== fetchSurface(e)) changed.push(e.name);
  }
  return changed;
}

async function main() {
  const data = JSON.parse(readFileSync(join(ROOT, "components.json"), "utf8"));
  const byName = new Map(data.showpiece.map((e) => [e.name, e]));
  const knownBlocked = knownBlockedHosts(data);

  if (FRAMEWORK && !ONLY) {
    console.error("--framework needs --only <name>: it tests one entry's frameworks.<name> variant, not a batch.");
    process.exit(1);
  }

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
    if (FRAMEWORK && !e.frameworks?.[FRAMEWORK]) {
      console.error(`Entry '${name}' has no frameworks.${FRAMEWORK} in components.json.`);
      process.exit(1);
    }
    entries.push(e);
  }

  const modeSuffix = FRAMEWORK ? ` (${FRAMEWORK})` : "";
  log(`Smoke-testing ${entries.length} ${modeLabel}${modeSuffix} entr${entries.length === 1 ? "y" : "ies"}`);
  log(`Mode: ${SOFT ? "soft (report only)" : "hard (blocks merge)"}`);

  const results = [];
  for (const e of entries) {
    const library = FRAMEWORK ? e.frameworks[FRAMEWORK].library : e.library;
    group(`${library}/${e.name}`);
    const r = await smokeTest(e, FRAMEWORK, knownBlocked);
    results.push({ ...r, library });
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

    if (r.status === "pass" && r.missingDeps && r.missingDeps.length > 0) {
      const w = `\`${r.name}\`: declared dep(s) ${r.missingDeps.map((d) => `\`${d}\``).join(", ")} are neither in the registry's own dependencies nor installable as written, so nothing verified them - either fix the spelling or move the prose into the entry's note`;
      warnings.push(w);
      log(`      warning: unverifiable declared dep(s): ${r.missingDeps.join(", ")}`);
    }
  }

  const failed = results.filter((r) => r.status === "fail");
  const skipped = results.filter((r) => r.status === "skip");

  let md = [
    `# Registry smoke test (${modeLabel} entries${FRAMEWORK ? ` - ${FRAMEWORK}` : ""})`,
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

main().then((code) => process.exit(code));
