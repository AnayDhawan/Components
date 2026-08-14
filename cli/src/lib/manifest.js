import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

import { MANIFEST_NAME } from "./layout.js";

export function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

/** Every file under `dir`, as paths relative to it, POSIX-separated. */
export function walk(dir) {
  const out = [];
  const rec = (d) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) rec(p);
      else out.push(relative(dir, p).split(sep).join("/"));
    }
  };
  if (existsSync(dir)) rec(dir);
  return out.sort();
}

/**
 * Copy a file or directory into destDir, returning the relative paths written.
 *
 * `skip` is a Set of destination-relative paths to leave untouched. It must be
 * honoured before the copy, not filtered out of the result afterwards - the
 * whole point is that those files keep their existing bytes.
 */
export function copyInto(src, destDir, destPrefix = "", skip = new Set()) {
  const written = [];
  const copyFile = (from, relPath) => {
    const rel = relPath.split(sep).join("/");
    if (skip.has(rel)) return;
    const to = join(destDir, relPath);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    written.push(rel);
  };

  if (statSync(src).isDirectory()) {
    for (const rel of walk(src)) {
      copyFile(join(src, rel), destPrefix ? join(destPrefix, rel) : rel);
    }
  } else {
    const base = destPrefix || src.split(/[\\/]/).pop();
    copyFile(src, base);
  }
  return written;
}

export function manifestPath(root) {
  return join(root, MANIFEST_NAME);
}

export function readManifest(root) {
  const p = manifestPath(root);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

export function writeManifest(root, data) {
  writeFileSync(manifestPath(root), JSON.stringify(data, null, 2) + "\n");
}

/**
 * Compare what is on disk against what `add` recorded writing.
 *
 * The point is to distinguish "this file is the one we installed" from "someone
 * edited it." An installed skill is a text file in the user's repo, and editing
 * it to fit a project is a completely reasonable thing to do, so `update` must
 * never assume it owns those bytes.
 *
 * Returns { modified, missing, unchanged } as arrays of relative paths.
 */
export function diffAgainstManifest(root, entry) {
  const modified = [];
  const missing = [];
  const unchanged = [];

  for (const [rel, recorded] of Object.entries(entry.files || {})) {
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      missing.push(rel);
      continue;
    }
    if (sha256(abs) === recorded) unchanged.push(rel);
    else modified.push(rel);
  }
  return { modified, missing, unchanged };
}

export function hashAll(root, relPaths) {
  const files = {};
  for (const rel of relPaths) {
    const abs = join(root, rel);
    if (existsSync(abs)) files[rel] = sha256(abs);
  }
  return files;
}
