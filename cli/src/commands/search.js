import { readFileSync } from "node:fs";
import { join } from "node:path";

import { distRoot } from "../lib/dist.js";

/**
 * The registry bundled inside dist/. Every agent's copy is byte-identical
 * (build-agent-dirs.sh stamps the same components.json into each one), so any
 * single bundle is a fine read-only source for search.
 */
function loadRegistry() {
  const path = join(distRoot(), ".claude", "skills", "components", "components.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

function haystacks(entry) {
  return [entry.name, entry.library, entry.effect, ...(entry.aliases || [])]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
}

/**
 * Every query term must match something (AND across terms), against any field
 * (OR within a term). A name or alias hit ranks above an effect-prose hit, so
 * "marquee" surfaces the entry named marquee before one that merely mentions it.
 */
function matchScore(entry, terms) {
  const hay = haystacks(entry);
  let score = 0;
  for (const term of terms) {
    if (entry.name?.toLowerCase().includes(term)) score += 3;
    else if ((entry.aliases || []).some((a) => a.toLowerCase().includes(term))) score += 2;
    else if (hay.some((h) => h.includes(term))) score += 1;
    else return 0;
  }
  return score;
}

/**
 * Search showpiece + fallback entries by name, alias, effect, or library.
 * Returns entries sorted best-match first, each tagged with `kind` so callers
 * can tell a live-fetched showpiece from a plain fallback.
 */
export function search(query, opts = {}) {
  const q = (query || "").trim().toLowerCase();
  if (!q) throw new Error("search needs a query, e.g. `components-skill search marquee`");
  const terms = q.split(/\s+/).filter(Boolean);

  const data = loadRegistry();
  const showpiece = (data.showpiece || []).map((e) => ({ ...e, kind: "showpiece" }));
  const fallback = (data.fallback_basic?.components || []).map((e) => ({ ...e, kind: "fallback" }));
  let pool = [...showpiece, ...fallback];

  if (opts.library) {
    const wanted = opts.library.toLowerCase();
    pool = pool.filter((e) => e.library?.toLowerCase() === wanted);
  }

  return pool
    .map((entry) => ({ entry, score: matchScore(entry, terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
    .map((r) => r.entry);
}

export function formatResults(results) {
  if (results.length === 0) {
    return "No matches. Try a shorter query, or drop --library to widen the search.";
  }
  return results
    .map((e) => {
      const tag = `[${e.kind}/${e.library}]`;
      const line = `  ${e.name.padEnd(18)} ${tag.padEnd(20)} ${e.effect || ""}`.trimEnd();
      const aliases = (e.aliases || []).slice(0, 3).join(", ");
      return aliases ? `${line}\n      aliases: ${aliases}` : line;
    })
    .join("\n");
}
