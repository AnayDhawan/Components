import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { agentLayout, resolveAgents } from "../lib/layout.js";
import { copyInto, diffAgainstManifest, hashAll, readManifest, writeManifest } from "../lib/manifest.js";
import { distRoot, packageVersion } from "../lib/dist.js";

export function update(opts) {
  const dist = distRoot();
  const version = packageVersion();
  const cwd = opts.cwd || process.cwd();

  const agents = opts.agent ? resolveAgents(opts.agent) : null;
  let touched = 0;
  let warned = 0;

  for (const agent of agents || resolveAgents("all")) {
    const layout = agentLayout(agent);
    if (opts.global && !layout.global) continue;

    const root = opts.global ? layout.global() : cwd;
    const manifest = readManifest(root);
    const entry = manifest && manifest.agents && manifest.agents[agent];

    if (!entry) {
      // Only complain about a missing install when the user named the agent.
      if (agents) {
        console.warn(`  ${layout.label}: not installed here (no manifest entry). Run \`add\` first.`);
      }
      continue;
    }

    const { modified, missing } = diffAgainstManifest(root, entry);

    if (modified.length && !opts.force) {
      // These bytes are not ours. Overwriting a local edit to a skill file is
      // silent data loss, and the whole reason the manifest records checksums.
      console.warn(`  ${layout.label}: ${modified.length} file(s) changed since install, NOT overwritten:`);
      for (const f of modified) console.warn(`      ${f}`);
      console.warn(`    Re-run with --force to overwrite, or move your edits aside first.`);
      warned += modified.length;
    }

    const skip = opts.force ? new Set() : new Set(modified);
    const sources = opts.global && layout.globalSources ? layout.globalSources : layout.sources;

    mkdirSync(root, { recursive: true });
    const written = [];
    for (const [fromRel, toRel] of sources) {
      const from = join(dist, fromRel);
      if (!existsSync(from)) continue;
      for (const rel of copyInto(from, root, toRel, skip)) written.push(rel);
    }

    // Keep the recorded checksum for anything we deliberately did not touch, so
    // a later update still recognises it as locally modified rather than as ours.
    const files = hashAll(root, written);
    for (const f of skip) if (entry.files[f]) files[f] = entry.files[f];

    manifest.agents[agent] = {
      version,
      installedAt: entry.installedAt,
      updatedAt: new Date().toISOString(),
      files,
    };
    writeManifest(root, manifest);

    const note = missing.length ? `, ${missing.length} restored` : "";
    console.log(`  ${layout.label}: ${written.length} file(s) updated to v${version}${note} -> ${root}`);
    touched++;
  }

  if (!touched) console.log("Nothing to update. Run `components-skill add` first.");
  if (warned) console.log(`\n${warned} locally-modified file(s) left alone.`);
  return { touched, warned };
}
