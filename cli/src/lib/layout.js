import { homedir } from "node:os";
import { join } from "node:path";

export const AGENTS = ["claude", "codex", "cursor", "gemini"];

/**
 * Where each agent's bundle comes from in dist/, and where it goes on disk.
 *
 * `sources` are [pathInsideDist, pathRelativeToInstallRoot] pairs. Cursor is the
 * only one that installs two things: the .mdc rule the agent reads, and the
 * payload it points at.
 *
 * Global installs go to the user config dir. Cursor has no documented user-level
 * rules dir the way the others have user-level skill dirs, so `--global` is
 * refused for it rather than silently writing somewhere that does nothing.
 */
const LAYOUT = {
  claude: {
    label: "Claude Code",
    sources: [[".claude/skills/components", ".claude/skills/components"]],
    global: () => join(homedir(), ".claude", "skills", "components"),
    globalSources: [[".claude/skills/components", ""]],
  },
  codex: {
    label: "Codex CLI",
    sources: [[".codex/skills/components", ".codex/skills/components"]],
    global: () => join(homedir(), ".codex", "skills", "components"),
    globalSources: [[".codex/skills/components", ""]],
  },
  cursor: {
    label: "Cursor",
    sources: [
      [".cursor/rules/components.mdc", ".cursor/rules/components.mdc"],
      [".cursor/components", ".cursor/components"],
    ],
    global: null, // no documented user-level rules dir
  },
  gemini: {
    label: "Gemini CLI",
    sources: [[".gemini/extensions/components", ".gemini/extensions/components"]],
    global: () => join(homedir(), ".gemini", "extensions", "components"),
    globalSources: [[".gemini/extensions/components", ""]],
  },
};

export function agentLayout(agent) {
  const l = LAYOUT[agent];
  if (!l) throw new Error(`Unknown agent '${agent}'. Expected one of: ${AGENTS.join(", ")}, all`);
  return l;
}

/** Resolve the requested agents, expanding "all". */
export function resolveAgents(value) {
  if (!value || value === "claude") return ["claude"];
  if (value === "all") return [...AGENTS];
  const wanted = value.split(",").map((s) => s.trim()).filter(Boolean);
  for (const a of wanted) {
    if (!AGENTS.includes(a)) {
      throw new Error(`Unknown agent '${a}'. Expected one of: ${AGENTS.join(", ")}, all`);
    }
  }
  return wanted;
}

export const MANIFEST_NAME = ".components-skill-manifest.json";
