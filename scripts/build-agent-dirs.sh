#!/usr/bin/env bash
# build-agent-dirs.sh: emits a ready-to-copy skill bundle per agent harness from the
# single SKILL.md + payload, into dist/. Each output dir is self-contained: copy it
# straight into a project (or user config dir) and the skill works.
#
# Formats verified against each project's own docs (not guessed):
#   .claude/skills/<name>/     -- Claude Code: SKILL.md + payload, as-is
#   .codex/skills/<name>/      -- Codex CLI: same SKILL.md format, documented cross-compatible
#   .cursor/rules/<name>.mdc   -- Cursor: YAML frontmatter (description, alwaysApply) + body
#   .gemini/extensions/<name>/ -- Gemini CLI: gemini-extension.json + commands/*.toml + GEMINI.md
#
# Ported from oss-launch's script of the same name. The one structural difference:
# this skill's payload is data, not tooling (SKILL.md + components.json + references/).
# scripts/ here is repo maintenance (validate, health-check, this file) and is not
# needed once the skill is installed somewhere else, so it is deliberately not copied.
#
# Usage: bash scripts/build-agent-dirs.sh [output-dir]   (default: dist/)

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/dist}"
NAME="components"

# Released version, for manifests that must declare one (Gemini's extension.json,
# .claude-plugin/plugin.json). components.json's meta.version is the source of truth
# here; unlike oss-launch, this repo ships a data file that already carries one.
# Fall back to the nearest tag, then 0.0.0: never a hardcoded literal that silently
# goes stale after a release.
VERSION="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1],encoding="utf-8"))["meta"]["version"])' "$ROOT/components.json" 2>/dev/null || true)"
[ -z "$VERSION" ] && VERSION="$(git -C "$ROOT" describe --tags --abbrev=0 2>/dev/null | sed 's/^v//' || true)"
[ -z "$VERSION" ] && VERSION="0.0.0"

# SKILL.md's own frontmatter description, reused verbatim for the harnesses that want
# one. Read from the file rather than restated, so there is exactly one copy of it.
DESCRIPTION="$(awk '/^description:[[:space:]]/{sub(/^description:[[:space:]]*/,""); print; exit}' "$ROOT/SKILL.md")"
[ -z "$DESCRIPTION" ] && { echo "error: no description in SKILL.md frontmatter" >&2; exit 1; }

# Everything after the closing --- of the YAML frontmatter. oss-launch has a separate
# AGENTS.md to hand to Gemini; this repo has no such file, so GEMINI.md is generated
# from SKILL.md's body. Strips the whole frontmatter block, not just its first line.
skill_body() {
  awk 'BEGIN{n=0} /^---[[:space:]]*$/{n++; if(n<=2) next} n>=2' "$ROOT/SKILL.md"
}

rm -rf "$OUT"
mkdir -p "$OUT"

# The functional payload every adapter needs: SKILL.md's own instructions plus what
# they reference. Repo-meta files (README, LICENSE, CONTRIBUTING, .github/, ...)
# describe the Components project itself and aren't needed once installed elsewhere.
copy_payload() {  # copy_payload <dest-dir>
  local dest="$1"
  mkdir -p "$dest"
  cp "$ROOT/SKILL.md" "$dest/"
  cp "$ROOT/components.json" "$dest/"
  cp -r "$ROOT/references" "$dest/"
}

# --- Claude Code: native format, no adaptation ---
copy_payload "$OUT/.claude/skills/$NAME"

# --- Codex CLI: same SKILL.md format, project-scoped .codex/skills/<name>/ ---
copy_payload "$OUT/.codex/skills/$NAME"

# --- Cursor: .mdc rule (frontmatter + body), self-contained payload alongside it ---
mkdir -p "$OUT/.cursor/rules"
{
  echo "---"
  echo "description: $DESCRIPTION"
  echo "alwaysApply: false"
  echo "---"
  echo ""
  echo "Payload for this rule lives alongside it at \`.cursor/$NAME/\` (SKILL.md,"
  echo "components.json, references/). Read \`.cursor/$NAME/SKILL.md\` in full and follow"
  echo "it exactly; the component registry is \`.cursor/$NAME/components.json\`."
  echo ""
  skill_body
} > "$OUT/.cursor/rules/$NAME.mdc"
copy_payload "$OUT/.cursor/$NAME"

# --- Gemini CLI: gemini-extension.json + commands/*.toml + GEMINI.md ---
GEMINI_DIR="$OUT/.gemini/extensions/$NAME"
mkdir -p "$GEMINI_DIR/commands"
cat > "$GEMINI_DIR/gemini-extension.json" <<JSON
{
  "name": "$NAME",
  "version": "$VERSION",
  "contextFileName": "GEMINI.md"
}
JSON
skill_body > "$GEMINI_DIR/GEMINI.md"
{
  echo "description = \"Fetch a proven animated React + Tailwind showpiece component live and adapt it to the project's brand tokens.\""
  echo 'prompt = """'
  echo "Read SKILL.md at \`.gemini/extensions/$NAME/SKILL.md\` in full and follow it exactly"
  echo "for this repo. The component registry is \`.gemini/extensions/$NAME/components.json\`."
  echo "Effect wanted, or question: {{args}}"
  echo '"""'
} > "$GEMINI_DIR/commands/$NAME.toml"
copy_payload "$GEMINI_DIR"

# --- Claude Code plugin manifest, pointing at the native bundle above ---
mkdir -p "$OUT/.claude-plugin"
cat > "$OUT/.claude-plugin/plugin.json" <<JSON
{
  "name": "$NAME",
  "version": "$VERSION",
  "description": "Showpiece UI for AI coding agents: match a described effect to a proven React + Tailwind component, fetch it live from its registry, and adapt it to the project's brand tokens.",
  "author": { "name": "Anay Dhawan" },
  "homepage": "https://github.com/AnayDhawan/Components",
  "license": "Apache-2.0",
  "skills": ["./.claude/skills/$NAME"]
}
JSON

echo "Built agent dirs under $OUT (version $VERSION):"
find "$OUT" -maxdepth 3 -type d | sort
