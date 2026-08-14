import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";

import { add } from "../src/commands/add.js";
import { update } from "../src/commands/update.js";
import { MANIFEST_NAME } from "../src/lib/layout.js";

const dirs = [];
function tmp() {
  const d = mkdtempSync(join(tmpdir(), "components-skill-test-"));
  dirs.push(d);
  return d;
}

// The commands print progress; keep test output readable.
let logs = [];
before(() => {
  console.log = (...a) => logs.push(a.join(" "));
  console.warn = (...a) => logs.push(a.join(" "));
});
after(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

describe("add", () => {
  it("writes the claude bundle into a project by default", () => {
    const cwd = tmp();
    const res = add({ cwd });

    assert.equal(res.length, 1);
    assert.equal(res[0].agent, "claude");

    const base = join(cwd, ".claude", "skills", "components");
    for (const f of ["SKILL.md", "components.json", join("references", "live-fetch.md")]) {
      assert.ok(existsSync(join(base, f)), `expected ${f}`);
    }
  });

  it("writes a manifest with a checksum per file", () => {
    const cwd = tmp();
    add({ cwd });

    const manifest = JSON.parse(readFileSync(join(cwd, MANIFEST_NAME), "utf8"));
    assert.ok(manifest.agents.claude, "claude entry");
    assert.ok(manifest.agents.claude.version, "records a version");

    const files = manifest.agents.claude.files;
    const names = Object.keys(files);
    assert.ok(names.length >= 5, `expected several files, got ${names.length}`);
    for (const [, hash] of Object.entries(files)) {
      assert.match(hash, /^[a-f0-9]{64}$/, "sha256 hex");
    }
  });

  it("installs cursor's rule and its payload", () => {
    const cwd = tmp();
    add({ cwd, agent: "cursor" });

    assert.ok(existsSync(join(cwd, ".cursor", "rules", "components.mdc")), "rule file");
    assert.ok(existsSync(join(cwd, ".cursor", "components", "SKILL.md")), "payload");
  });

  it("installs every agent with --agent all", () => {
    const cwd = tmp();
    const res = add({ cwd, agent: "all" });

    assert.equal(res.length, 4);
    assert.ok(existsSync(join(cwd, ".claude", "skills", "components", "SKILL.md")));
    assert.ok(existsSync(join(cwd, ".codex", "skills", "components", "SKILL.md")));
    assert.ok(existsSync(join(cwd, ".cursor", "rules", "components.mdc")));
    assert.ok(existsSync(join(cwd, ".gemini", "extensions", "components", "gemini-extension.json")));

    const manifest = JSON.parse(readFileSync(join(cwd, MANIFEST_NAME), "utf8"));
    assert.deepEqual(Object.keys(manifest.agents).sort(), ["claude", "codex", "cursor", "gemini"]);
  });

  it("rejects an unknown agent", () => {
    assert.throws(() => add({ cwd: tmp(), agent: "emacs" }), /Unknown agent/);
  });
});

describe("update", () => {
  it("refuses to clobber a locally edited file", () => {
    const cwd = tmp();
    add({ cwd });

    const skill = join(cwd, ".claude", "skills", "components", "SKILL.md");
    const edited = "# my local edits\n";
    writeFileSync(skill, edited);

    logs = [];
    const res = update({ cwd });

    assert.equal(res.warned, 1, "one modified file reported");
    assert.equal(readFileSync(skill, "utf8"), edited, "local edit preserved");
    assert.ok(
      logs.join("\n").includes("changed since install"),
      "warns about the modification",
    );
  });

  it("--force overwrites a locally edited file", () => {
    const cwd = tmp();
    add({ cwd });

    const skill = join(cwd, ".claude", "skills", "components", "SKILL.md");
    writeFileSync(skill, "# my local edits\n");

    update({ cwd, force: true });
    assert.notEqual(readFileSync(skill, "utf8"), "# my local edits\n", "was overwritten");
  });

  it("restores a file deleted after install", () => {
    const cwd = tmp();
    add({ cwd });

    const ref = join(cwd, ".claude", "skills", "components", "references", "live-fetch.md");
    rmSync(ref);
    assert.ok(!existsSync(ref));

    update({ cwd });
    assert.ok(existsSync(ref), "restored");
  });

  it("leaves an untouched install byte-identical", () => {
    const cwd = tmp();
    add({ cwd });

    const skill = join(cwd, ".claude", "skills", "components", "SKILL.md");
    const before = readFileSync(skill);

    logs = [];
    const res = update({ cwd });

    assert.equal(res.warned, 0, "nothing reported as modified");
    assert.deepEqual(readFileSync(skill), before);
  });

  it("says so when nothing is installed", () => {
    logs = [];
    update({ cwd: tmp() });
    assert.ok(logs.join("\n").includes("Nothing to update"));
  });
});
