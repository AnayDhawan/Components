#!/usr/bin/env node
import { add } from "../src/commands/add.js";
import { update } from "../src/commands/update.js";
import { search, formatResults } from "../src/commands/search.js";
import { packageVersion } from "../src/lib/dist.js";
import { AGENTS } from "../src/lib/layout.js";

const USAGE = `components-skill - install the \`components\` skill into your agent's config dir

Usage:
  npx components-skill@latest add [options]
  npx components-skill@latest update [options]
  npx components-skill@latest search <query> [options]

Options:
  --agent <name>    ${AGENTS.join(" | ")} | all      (default: claude, add/update only)
  --global          install into your user config dir instead of this project
  --force           update: overwrite files you have edited locally
  --library <name>  search: restrict to one source library
  -h, --help        show this
  -v, --version     print the version

Examples:
  npx components-skill@latest add                     # .claude/skills/components here
  npx components-skill@latest add --agent all         # every supported agent
  npx components-skill@latest add --agent cursor      # .cursor/rules + payload
  npx components-skill@latest add --global            # ~/.claude/skills/components
  npx components-skill@latest update                  # refresh, keeping local edits
  npx components-skill@latest search "laptop opening" # find a showpiece by effect/alias
  npx components-skill@latest search card --library cult-ui
`;

/**
 * Hand-rolled, because the whole surface is two commands and three flags.
 * A framework dependency here would be larger than the thing it parses, and this
 * package's main selling point is that it installs without pulling anything in.
 */
function parse(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "-v" || a === "--version") opts.version = true;
    else if (a === "--global") opts.global = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--agent") {
      opts.agent = argv[++i];
      if (!opts.agent || opts.agent.startsWith("-")) throw new Error("--agent needs a value");
    } else if (a.startsWith("--agent=")) opts.agent = a.slice("--agent=".length);
    else if (a === "--library") {
      opts.library = argv[++i];
      if (!opts.library || opts.library.startsWith("-")) throw new Error("--library needs a value");
    } else if (a.startsWith("--library=")) opts.library = a.slice("--library=".length);
    else if (a.startsWith("-")) throw new Error(`Unknown flag: ${a}`);
    else opts._.push(a);
  }
  return opts;
}

function main(argv) {
  let opts;
  try {
    opts = parse(argv);
  } catch (e) {
    console.error(e.message);
    console.error(`\n${USAGE}`);
    return 1;
  }

  if (opts.version) {
    console.log(packageVersion());
    return 0;
  }

  const cmd = opts._[0];
  if (opts.help || !cmd) {
    console.log(USAGE);
    return cmd ? 0 : 1;
  }

  try {
    if (cmd === "add") {
      console.log(`Installing components skill...`);
      const r = add(opts);
      return r.length ? 0 : 1;
    }
    if (cmd === "update") {
      console.log(`Updating components skill...`);
      update(opts);
      return 0;
    }
    if (cmd === "search") {
      const query = opts._.slice(1).join(" ");
      const results = search(query, opts);
      console.log(formatResults(results));
      return results.length ? 0 : 1;
    }
    console.error(`Unknown command: ${cmd}\n`);
    console.error(USAGE);
    return 1;
  } catch (e) {
    console.error(`\nerror: ${e.message}`);
    return 1;
  }
}

process.exit(main(process.argv.slice(2)));
