import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Token extraction: reads a target project's brand tokens - CSS custom
 * properties, a Tailwind v4 `@theme` block, and a best-effort read of a
 * legacy `tailwind.config.*`'s `theme.extend.colors` - into one comparable
 * structure.
 *
 * This is the piece references/adaptation.md § 1 has always described in
 * prose ("find the project's token source... map them onto them") without
 * anything that actually reads it. Adaptation done by eye does not give a
 * future verify step ("did the adapted component actually pick up the
 * project's --primary, or did a demo's bg-zinc-900 survive") anything to diff
 * against - that diff needs both sides in the same shape, and this is the
 * target-project side. See components-skill.js's `tokens` command.
 */

/**
 * The shadcn CSS-variable convention `references/adaptation.md` § 1 and § 4
 * name directly (`--primary`, `--background`, `--muted`, `--ring`, ...).
 * Reported on separately from "every custom property this project happens to
 * define" because these are the ones adaptation actually maps demo colors
 * onto - a project missing them needs shadcn's own CSS-variable init first
 * (adaptation.md § 1's own fallback), not a bigger token list.
 */
export const KNOWN_ADAPTATION_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "radius",
];

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".svelte-kit",
  ".turbo",
  ".vercel",
  "out",
  "coverage",
]);

// Checked before any directory walk: the overwhelming majority of real
// projects keep their global stylesheet at one of these paths, so this is the
// fast path. The walk below is the fallback for everything else.
const COMMON_CSS_PATHS = [
  "src/app/globals.css",
  "app/globals.css",
  "src/index.css",
  "src/app.css",
  "src/styles/globals.css",
  "styles/globals.css",
  "src/styles/index.css",
  "src/routes/layout.css",
  "src/main.css",
  "styles/index.css",
];

const TAILWIND_CONFIG_NAMES = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.cjs", "tailwind.config.mjs"];

/**
 * Bounded breadth-first walk for a project's `.css` files when none of
 * COMMON_CSS_PATHS exist. Capped on both depth and file count so an
 * unusually large or deeply nested project cannot make this hang - a project
 * whose stylesheet lives somewhere this cannot find gets `cssFile: null` and
 * an empty token set back, never a stuck process.
 */
function scanForCssFiles(root, { maxDepth = 5, maxFiles = 400 } = {}) {
  const found = [];
  let frontier = [{ dir: root, depth: 0 }];
  while (frontier.length && found.length < maxFiles) {
    const next = [];
    for (const { dir, depth } of frontier) {
      let entries;
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const e of entries) {
        if (e.name.startsWith(".") && e.name !== ".") continue;
        if (IGNORED_DIRS.has(e.name)) continue;
        const p = join(dir, e.name);
        if (e.isDirectory()) {
          if (depth < maxDepth) next.push({ dir: p, depth: depth + 1 });
        } else if (e.isFile() && e.name.endsWith(".css")) {
          found.push(p);
          if (found.length >= maxFiles) break;
        }
      }
      if (found.length >= maxFiles) break;
    }
    frontier = next;
  }
  return found;
}

function findCandidateCssFiles(root) {
  const direct = COMMON_CSS_PATHS.map((p) => join(root, p)).filter((p) => existsSync(p));
  return direct.length ? direct : scanForCssFiles(root);
}

function findTailwindConfig(root) {
  for (const name of TAILWIND_CONFIG_NAMES) {
    const p = join(root, name);
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * The body of the first top-level block whose opening matches `selectorRe`
 * (selectorRe must itself match through the opening `{`). Brace-counted, not
 * a real CSS parser - this repo has none as a dependency, and adding one for
 * a handful of shadcn-shaped token files would be a bigger addition than the
 * thing it parses (the same call CONTRIBUTING.md's own CLI argument parser
 * already makes). Assumes a block's declarations don't themselves contain
 * unbalanced `{`/`}`, true of every real token file this was built against -
 * a file that violates this reports fewer tokens than it has, it never
 * throws or hangs.
 */
function extractBlock(cssText, selectorRe) {
  const m = selectorRe.exec(cssText);
  if (!m) return null;
  let depth = 1;
  let i = m.index + m[0].length;
  while (i < cssText.length && depth > 0) {
    if (cssText[i] === "{") depth++;
    else if (cssText[i] === "}") depth--;
    i++;
  }
  return cssText.slice(m.index + m[0].length, i - 1);
}

function extractDeclarations(blockBody) {
  const out = {};
  const re = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(blockBody))) out[m[1]] = m[2].trim();
  return out;
}

/**
 * Tailwind v4 spells a color token `--color-primary` inside `@theme`; the
 * shadcn `:root { --primary: ... }` convention this file otherwise follows
 * (and that adaptation.md names) spells the same token `--primary`. Stripped
 * here so both spellings land on one key and a project on either Tailwind
 * version reports the same shape.
 */
function normalizeThemeColors(themeDecls) {
  const out = {};
  for (const [k, v] of Object.entries(themeDecls)) {
    if (k.startsWith("color-")) out[k.slice("color-".length)] = v;
  }
  return out;
}

function parseCssTokens(cssText) {
  const root = extractBlock(cssText, /:root\s*{/);
  const darkClass = extractBlock(cssText, /\.dark\s*{/);
  const darkAttr = extractBlock(cssText, /\[data-theme=["']dark["']\]\s*{/);
  const theme = extractBlock(cssText, /@theme(?:\s+inline)?\s*{/);

  const light = {
    ...(root ? extractDeclarations(root) : {}),
    ...normalizeThemeColors(theme ? extractDeclarations(theme) : {}),
  };
  const dark = darkClass ? extractDeclarations(darkClass) : darkAttr ? extractDeclarations(darkAttr) : {};

  let darkModeStrategy = null;
  if (darkAttr) darkModeStrategy = "attribute";
  else if (darkClass) darkModeStrategy = "class";
  else if (/@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/.test(cssText)) darkModeStrategy = "media";

  return { light, dark, darkModeStrategy };
}

/**
 * Best-effort, regex-only read of `theme.extend.colors` (or `theme.colors`)
 * from a legacy Tailwind v3 config. Not a JS/TS parser: it handles the two
 * shapes actually seen in the wild - `primary: "#111"` and one level of
 * nesting, `primary: { DEFAULT: "#111", foreground: "#fff" }` - and returns
 * null rather than guessing at anything else (a computed value, a spread, a
 * CSS-var passthrough like `hsl(var(--primary))`). A config in a shape this
 * cannot read is a "did not find" result, not a wrong answer.
 */
function extractTailwindConfigColors(source) {
  const colorsBlock = extractBlock(source, /colors\s*:\s*{/);
  if (!colorsBlock) return null;

  const out = {};
  const consumed = new Set();

  const nestedRe = /([a-zA-Z0-9_-]+)\s*:\s*{([^{}]*)}/g;
  let nm;
  while ((nm = nestedRe.exec(colorsBlock))) {
    const name = nm[1];
    consumed.add(name);
    const inner = nm[2];
    const defaultM = /DEFAULT\s*:\s*["'`]([^"'`]+)["'`]/.exec(inner);
    if (defaultM) out[name] = defaultM[1];
    const fgM = /foreground\s*:\s*["'`]([^"'`]+)["'`]/.exec(inner);
    if (fgM) out[`${name}-foreground`] = fgM[1];
  }

  const flatSource = colorsBlock.replace(/{[^{}]*}/g, " ");
  const flatRe = /([a-zA-Z0-9_-]+)\s*:\s*["'`]([^"'`]+)["'`]/g;
  let fm;
  while ((fm = flatRe.exec(flatSource))) {
    if (!consumed.has(fm[1])) out[fm[1]] = fm[2];
  }

  return Object.keys(out).length ? out : null;
}

/**
 * Read `projectDir`'s brand tokens into one comparable structure. Throws if
 * `projectDir` does not exist or is not a directory; returns an (honestly)
 * empty result, not an error, when it exists but no token source is found -
 * "no tokens configured yet" is a real, reportable project state, per
 * adaptation.md § 1's own fallback ("set up shadcn CSS variables first").
 */
export function extractTokens(projectDir) {
  if (!existsSync(projectDir) || !statSync(projectDir).isDirectory()) {
    throw new Error(`not a directory: ${projectDir}`);
  }

  let cssFile = null;
  let cssResult = { light: {}, dark: {}, darkModeStrategy: null };
  for (const f of findCandidateCssFiles(projectDir)) {
    let text;
    try {
      text = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    if (!/:root\s*{|@theme/.test(text)) continue;
    const parsed = parseCssTokens(text);
    if (Object.keys(parsed.light).length || Object.keys(parsed.dark).length) {
      cssFile = f;
      cssResult = parsed;
      break; // first file that actually declares tokens; see findCandidateCssFiles
    }
  }

  const configPath = findTailwindConfig(projectDir);
  const tailwindConfigColors = configPath ? extractTailwindConfigColors(readFileSync(configPath, "utf8")) : null;

  const knownTokens = {};
  const missingKnownTokens = [];
  for (const name of KNOWN_ADAPTATION_TOKENS) {
    if (cssResult.light[name] !== undefined) knownTokens[name] = cssResult.light[name];
    else if (tailwindConfigColors?.[name] !== undefined) knownTokens[name] = tailwindConfigColors[name];
    else missingKnownTokens.push(name);
  }

  return {
    projectDir,
    cssFile: cssFile ? relative(projectDir, cssFile) : null,
    configFile: configPath ? relative(projectDir, configPath) : null,
    darkModeStrategy: cssResult.darkModeStrategy,
    light: cssResult.light,
    dark: cssResult.dark,
    tailwindConfigColors,
    knownTokens,
    missingKnownTokens,
  };
}

export function formatTokens(result) {
  const lines = [];
  lines.push(`Project: ${result.projectDir}`);
  if (result.cssFile) {
    const extra = result.tailwindConfigColors ? " + tailwind.config colors" : "";
    lines.push(`Token source: ${result.cssFile} (CSS custom properties${extra})`);
  } else if (result.configFile) {
    lines.push(`Token source: ${result.configFile} (tailwind.config colors only; no :root or @theme block found)`);
  } else {
    lines.push("Token source: none found");
  }
  lines.push(`Dark mode: ${result.darkModeStrategy ?? "not detected"}`);
  lines.push("");
  lines.push("Known adaptation tokens (references/adaptation.md § 1):");
  for (const name of KNOWN_ADAPTATION_TOKENS) {
    const v = result.knownTokens[name];
    const mark = v !== undefined ? "[x]" : "[ ]";
    lines.push(`  ${mark} --${name.padEnd(20)} ${v ?? "(not found)"}`);
  }
  if (result.missingKnownTokens.length) {
    lines.push("");
    lines.push(
      `Missing ${result.missingKnownTokens.length}/${KNOWN_ADAPTATION_TOKENS.length}. Adapt onto the closest ` +
        `existing token, or run \`npx shadcn@latest init\` first so every component shares one source of truth ` +
        `(adaptation.md § 1).`,
    );
  }
  const extraLight = Object.keys(result.light).filter((k) => !KNOWN_ADAPTATION_TOKENS.includes(k));
  if (extraLight.length) {
    lines.push("");
    lines.push(`Other project tokens found: ${extraLight.map((k) => `--${k}`).join(", ")}`);
  }
  return lines.join("\n");
}
