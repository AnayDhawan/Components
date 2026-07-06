# Handoff skills (optional)

`components` is a **sourcing** skill only - it fetches a showpiece and brand-adapts it, then
stops. Final polish is deliberately out of scope and, if a downstream quality skill happens
to be installed, handed off to it. That handoff is optional, not a dependency.

## What "hand off polish" actually means

`SKILL.md`'s decision flow ends with "hand off polish -> impeccable / frontend-design." This
is not a hard dependency - `components` fully completes its job (fetch, install `deps`, adapt
brand tokens + motion + responsive per `references/adaptation.md`) with zero downstream
skills installed. The handoff is only an optional next step when a harness also happens to
have a UI-polish skill available.

## The two skills referenced

- **`frontend-design`** - an official Claude Code plugin for aesthetic direction, typography,
  and distinctive visual choices. Installed via the Claude Code plugin marketplace
  (`claude-plugins-official/frontend-design`), separately from this repo.
- **`impeccable`** - a broader UI/UX audit-and-polish skill (design critique, hierarchy,
  accessibility, theming, responsive behavior). Availability depends entirely on the user's
  own skill library; it ships with neither `components` nor Claude Code itself.

Neither is a package dependency of this repo - no npm/pip install is required for
`components` to work. They are sibling **agent skills** that may or may not exist in a given
harness's skill library, discovered by the harness at invocation time, not by this repo.

## Graceful degradation when neither is installed

1. `components` still completes fully on its own. The fetched component is already
   brand-adapted (tokens, `prefers-reduced-motion`, responsive) - that is this skill's actual
   job, not a partial result waiting on a handoff.
2. Do not block, warn, or error about a missing handoff skill - it is optional extra polish,
   not a correctness requirement.
3. Optionally tell the user a dedicated polish pass is available if they install
   `frontend-design` or an equivalent skill, but ship the adapted output either way.

## Acceptance

A project using `components` with neither `impeccable` nor `frontend-design` installed still
gets a fully working, adapted showpiece and no missing-dependency errors.
