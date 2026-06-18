# Security Policy

## Scope

`components` is a curated, read-only Claude Code skill: a `SKILL.md`, a JSON
data file (`components.json`), and markdown references. It ships **no executable
code** and **does not fetch anything at runtime**. The main "security" surface is
therefore the integrity of the curated links and commands it recommends.

## Supported versions

The latest released version (`v0.x`) is supported. Older versions are not
patched.

## Reporting a vulnerability or unsafe recommendation

Please report privately rather than opening a public issue if the report
involves a security risk. Examples worth reporting:

- A `source.ref` that points to a typosquatted package or a compromised/hijacked
  domain.
- A recommended `npx` command or copy source that pulls malicious code.
- A license claim in an entry that is incorrect in a way that creates legal risk.

**How to report:** open a [GitHub Security Advisory](https://docs.github.com/en/code-security/security-advisories)
on the repository, or send a private message to the maintainer (`@AnayDhawan`).
Do not disclose publicly until the entry has been fixed or removed.

## Response

- Acknowledgement target: within 7 days.
- Confirmed unsafe entries are removed or corrected immediately and noted in
  [CHANGELOG.md](./CHANGELOG.md).

## Non-vulnerabilities

Dead links and outdated commands are **bugs, not vulnerabilities** - open a
normal issue or PR for those.
