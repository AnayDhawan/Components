import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";

import { extractTokens, formatTokens, KNOWN_ADAPTATION_TOKENS } from "../src/commands/tokens.js";

const dirs = [];
function tmp() {
  const d = mkdtempSync(join(tmpdir(), "components-skill-tokens-test-"));
  dirs.push(d);
  return d;
}
function write(dir, relPath, content) {
  const p = join(dir, relPath);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, content);
}
after(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

describe("extractTokens", () => {
  it("throws on a path that is not a directory", () => {
    assert.throws(() => extractTokens(join(tmp(), "nope")), /not a directory/);
  });

  it("reports no token source in an empty project", () => {
    const dir = tmp();
    const result = extractTokens(dir);
    assert.equal(result.cssFile, null);
    assert.equal(result.configFile, null);
    assert.equal(result.darkModeStrategy, null);
    assert.equal(result.missingKnownTokens.length, KNOWN_ADAPTATION_TOKENS.length);
  });

  it("finds a shadcn-style :root + .dark block at the common Next.js path", () => {
    const dir = tmp();
    write(
      dir,
      "src/app/globals.css",
      `:root {\n  --background: 0 0% 100%;\n  --primary: 222 47% 11%;\n  --primary-foreground: 210 40% 98%;\n  --muted: 210 40% 96%;\n  --border: 214 32% 91%;\n  --radius: 0.5rem;\n}\n.dark {\n  --background: 222 47% 11%;\n  --primary: 210 40% 98%;\n}\n`,
    );
    const result = extractTokens(dir);
    assert.equal(result.cssFile, join("src", "app", "globals.css"));
    assert.equal(result.darkModeStrategy, "class");
    assert.equal(result.knownTokens.primary, "222 47% 11%");
    assert.equal(result.knownTokens.background, "0 0% 100%");
    assert.equal(result.dark.background, "222 47% 11%");
    assert.ok(!result.missingKnownTokens.includes("primary"));
    assert.ok(result.missingKnownTokens.includes("accent"));
  });

  it("finds a Tailwind v4 @theme block and normalizes --color-* to the shared shape", () => {
    const dir = tmp();
    write(
      dir,
      "src/index.css",
      `@import "tailwindcss";\n\n@theme {\n  --color-primary: oklch(0.55 0.2 260);\n  --color-background: oklch(1 0 0);\n  --color-accent: oklch(0.7 0.15 200);\n}\n`,
    );
    const result = extractTokens(dir);
    assert.equal(result.cssFile, join("src", "index.css"));
    assert.equal(result.knownTokens.primary, "oklch(0.55 0.2 260)");
    assert.equal(result.knownTokens.accent, "oklch(0.7 0.15 200)");
  });

  it("detects data-theme=\"dark\" as the attribute strategy", () => {
    const dir = tmp();
    write(
      dir,
      "src/app.css",
      `:root {\n  --primary: #111;\n}\n[data-theme="dark"] {\n  --primary: #eee;\n}\n`,
    );
    const result = extractTokens(dir);
    assert.equal(result.darkModeStrategy, "attribute");
    assert.equal(result.dark.primary, "#eee");
  });

  it("detects prefers-color-scheme media as the media strategy", () => {
    const dir = tmp();
    write(
      dir,
      "src/app.css",
      `:root {\n  --primary: #111;\n}\n@media (prefers-color-scheme: dark) {\n  :root { --primary: #eee; }\n}\n`,
    );
    const result = extractTokens(dir);
    assert.equal(result.darkModeStrategy, "media");
  });

  it("falls back to a bounded directory walk when no common path matches", () => {
    const dir = tmp();
    write(dir, "packages/ui/tokens.css", `:root {\n  --primary: #123456;\n}\n`);
    const result = extractTokens(dir);
    assert.equal(result.cssFile, join("packages", "ui", "tokens.css"));
    assert.equal(result.knownTokens.primary, "#123456");
  });

  it("never descends into node_modules during the fallback walk", () => {
    const dir = tmp();
    write(dir, "node_modules/some-pkg/dist/style.css", `:root {\n  --primary: #ffffff;\n}\n`);
    const result = extractTokens(dir);
    assert.equal(result.cssFile, null);
  });

  it("reads a flat tailwind.config.js color as a fallback when no CSS block exists", () => {
    const dir = tmp();
    write(
      dir,
      "tailwind.config.js",
      `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        primary: "#0ea5e9",\n        background: "#ffffff",\n      },\n    },\n  },\n};\n`,
    );
    const result = extractTokens(dir);
    assert.equal(result.cssFile, null);
    assert.equal(result.configFile, "tailwind.config.js");
    assert.equal(result.knownTokens.primary, "#0ea5e9");
    assert.equal(result.tailwindConfigColors.primary, "#0ea5e9");
  });

  it("reads a one-level-nested tailwind.config color (DEFAULT + foreground)", () => {
    const dir = tmp();
    write(
      dir,
      "tailwind.config.ts",
      `export default {\n  theme: {\n    extend: {\n      colors: {\n        primary: { DEFAULT: "#0ea5e9", foreground: "#ffffff" },\n      },\n    },\n  },\n};\n`,
    );
    const result = extractTokens(dir);
    assert.equal(result.tailwindConfigColors.primary, "#0ea5e9");
    assert.equal(result.tailwindConfigColors["primary-foreground"], "#ffffff");
  });

  it("prefers CSS custom properties over tailwind.config when both exist", () => {
    const dir = tmp();
    write(dir, "src/app/globals.css", `:root {\n  --primary: #csswins;\n}\n`);
    write(
      dir,
      "tailwind.config.js",
      `module.exports = { theme: { extend: { colors: { primary: "#configloses" } } } };\n`,
    );
    const result = extractTokens(dir);
    assert.equal(result.knownTokens.primary, "#csswins");
  });

  it("returns null tailwindConfigColors for a config shape it cannot read", () => {
    const dir = tmp();
    write(dir, "tailwind.config.js", `module.exports = { theme: { extend: { colors: someFunction() } } };\n`);
    const result = extractTokens(dir);
    assert.equal(result.tailwindConfigColors, null);
  });
});

describe("formatTokens", () => {
  it("marks found tokens [x] and missing ones [ ], and lists extra project tokens", () => {
    const dir = tmp();
    write(dir, "src/app/globals.css", `:root {\n  --primary: #111;\n  --brand-glow: #f0f;\n}\n`);
    const out = formatTokens(extractTokens(dir));
    assert.match(out, /\[x\] --primary/);
    assert.match(out, /\[ \] --background/);
    assert.match(out, /Other project tokens found: --brand-glow/);
  });

  it("says no token source was found", () => {
    const out = formatTokens(extractTokens(tmp()));
    assert.match(out, /Token source: none found/);
  });
});
