import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(HERE, "..", "..");

/**
 * The prebuilt bundles that ship inside this package.
 *
 * Deliberately shipped rather than fetched from GitHub at install time: an
 * installer that needs the network to reach a specific repo fails in exactly the
 * environments people most want a working install (offline, proxied, corporate
 * CI), and it would pin the CLI's behaviour to whatever is on main rather than
 * to the version the user asked for.
 *
 * Populated by `prepack`, which runs the repo's scripts/build-agent-dirs.sh into
 * cli/dist/. In a git checkout dist/ may not exist until you run `npm run build`.
 */
export function distRoot() {
  const dist = join(PKG_ROOT, "dist");
  if (!existsSync(dist)) {
    throw new Error(
      `Bundles not found at ${dist}\n` +
        `If you are running from a git checkout, build them first:\n` +
        `  npm run build   (from cli/)`,
    );
  }
  return dist;
}

export function packageVersion() {
  return JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")).version;
}
