# components-skill

Install the [`components`](https://github.com/AnayDhawan/Components) skill into your coding agent's config directory.

`components` is a **sourcing skill**: describe an effect ("a laptop opening on scroll", "animated beams behind the features"), and your agent matches it to a proven React + Tailwind showpiece, fetches the real component live from its registry, and adapts it to your brand tokens. It ships pointers, never pasted code.

## Install

```bash
npx components-skill@latest add
```

That writes `.claude/skills/components/` into the current project. Nothing is installed globally and the package has **zero dependencies**.

## Usage

```bash
npx components-skill@latest add                  # Claude Code, this project
npx components-skill@latest add --agent all      # every supported agent
npx components-skill@latest add --agent cursor   # just Cursor
npx components-skill@latest add --global         # ~/.claude/skills/components
npx components-skill@latest update               # refresh, keeping your edits
npx components-skill@latest search "laptop opening"   # find a showpiece before installing
```

### Options

| Flag | Meaning |
|------|---------|
| `--agent <name>` | `claude` \| `codex` \| `cursor` \| `gemini` \| `all`. Default `claude`. Comma-separated lists work too. `add`/`update` only. |
| `--global` | Install into your user config dir instead of the current project. Not supported for Cursor, which has no documented user-level rules directory. |
| `--force` | On `update`, overwrite files you have edited locally. |
| `--library <name>` | On `search`, restrict results to one source library (`aceternity`, `magicui`, `cult-ui`, `reactbits`, `21st.dev`, `shadcn`, `tremor`). |
| `-v`, `--version` | Print the version. |

## `search`: find a showpiece before you install

The registry has 39 showpieces plus 12 plain fallbacks; `search` looks up name, alias, effect, and library entirely offline, against the same `components.json` `add` bundles:

```
$ npx components-skill@latest search marquee
  marquee            [showpiece/magicui]  infinite scrolling row/grid of logos or cards
      aliases: logo wall, infinite scroll row, testimonial carousel

$ npx components-skill@latest search card --library cult-ui
  texture-card       [showpiece/cult-ui]  layered texture/border card with tactile depth
      aliases: tactile card, textured gradient card, layered border card
```

Every query term must match (name, alias, effect, or library); exits `1` with no results.

### Where things land

| Agent | Path |
|-------|------|
| Claude Code | `.claude/skills/components/` |
| Codex CLI | `.codex/skills/components/` |
| Cursor | `.cursor/rules/components.mdc` + payload at `.cursor/components/` |
| Gemini CLI | `.gemini/extensions/components/` |

## `update` will not overwrite your edits

An installed skill is just text in your repo, and editing it to fit a project is a reasonable thing to do. So `add` records a SHA-256 of every file it writes, in `.components-skill-manifest.json` at the install root.

`update` re-hashes those files first. Anything that no longer matches is treated as yours: it is reported and **left alone**, while everything else is refreshed.

```
$ npx components-skill@latest update
Updating components skill...
  Claude Code: 1 file(s) changed since install, NOT overwritten:
      .claude/skills/components/SKILL.md
    Re-run with --force to overwrite, or move your edits aside first.
  Claude Code: 5 file(s) updated to v1.1.1 -> /path/to/project

1 locally-modified file(s) left alone.
```

Deleted files are restored. `--force` overwrites everything.

## Offline by design

The bundles are built into the package at publish time, so `add` copies from disk and never reaches the network. An installer that needs to fetch from GitHub fails in exactly the environments where you most want it to work (offline, proxied, locked-down CI), and it would pin behaviour to whatever is on `main` rather than to the version you asked for.

## Links

- Skill repo, full showpiece list and licenses: [AnayDhawan/Components](https://github.com/AnayDhawan/Components)
- Issues: [github.com/AnayDhawan/Components/issues](https://github.com/AnayDhawan/Components/issues)

Apache-2.0. Components fetched *via* the skill carry their own upstream licenses.
