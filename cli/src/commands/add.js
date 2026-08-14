import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { agentLayout, resolveAgents } from "../lib/layout.js";
import { copyInto, hashAll, readManifest, writeManifest } from "../lib/manifest.js";
import { distRoot, packageVersion } from "../lib/dist.js";

export function add(opts) {
  const agents = resolveAgents(opts.agent);
  const dist = distRoot();
  const version = packageVersion();
  const cwd = opts.cwd || process.cwd();

  const results = [];
  for (const agent of agents) {
    const layout = agentLayout(agent);

    if (opts.global && !layout.global) {
      console.warn(
        `  skip ${layout.label}: --global is not supported (no documented user-level location); install it into a project instead`,
      );
      continue;
    }

    const root = opts.global ? layout.global() : cwd;
    const sources = opts.global && layout.globalSources ? layout.globalSources : layout.sources;

    mkdirSync(root, { recursive: true });

    const written = [];
    for (const [fromRel, toRel] of sources) {
      const from = join(dist, fromRel);
      if (!existsSync(from)) {
        throw new Error(
          `Bundle missing from package: ${fromRel}\n` +
            `This package ships prebuilt bundles in dist/; reinstall components-skill.`,
        );
      }
      written.push(...copyInto(from, root, toRel));
    }

    // One manifest per install root, keyed by agent, so installing several
    // agents into the same project does not have them overwrite each other's
    // record of what they wrote.
    const manifest = readManifest(root) || { name: "components-skill", agents: {} };
    manifest.agents[agent] = {
      version,
      installedAt: new Date().toISOString(),
      files: hashAll(root, written),
    };
    writeManifest(root, manifest);

    console.log(`  ${layout.label}: ${written.length} file(s) -> ${root}`);
    results.push({ agent, root, files: written });
  }

  if (results.length) {
    console.log(`\ncomponents v${version} installed. Ask your agent for a showpiece effect, e.g.`);
    console.log(`  "add a macbook-scroll hero"`);
  }
  return results;
}
