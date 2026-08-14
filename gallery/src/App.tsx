import type { ReactNode } from "react";

import showpieces from "./showpieces.json";
import { Demo3dCard } from "./demos/Demo3dCard";
import { DemoMarquee } from "./demos/DemoMarquee";
import { DemoBlurText } from "./demos/DemoBlurText";
import { DemoMatrixText } from "./demos/DemoMatrixText";

type Entry = {
  name: string;
  library: string;
  effect: string;
  aliases: string[];
  license: string;
  deps: string[];
  ref: string;
  available: boolean;
  reason?: string;
};

const DEMOS: Record<string, () => ReactNode> = {
  "3d-card": Demo3dCard,
  marquee: DemoMarquee,
  "blur-text": DemoBlurText,
  "matrix-text": DemoMatrixText,
};

const REPO = "https://github.com/AnayDhawan/Components";

function Card({ entry }: { entry: Entry }) {
  const Demo = DEMOS[entry.name];

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
      <div className="flex min-h-[22rem] items-center justify-center overflow-hidden bg-neutral-900/40 p-6">
        {entry.available && Demo ? (
          <Demo />
        ) : (
          <div className="max-w-sm text-center">
            <p className="text-sm font-medium text-neutral-300">Upstream temporarily unavailable</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">{entry.reason}</p>
            <p className="mt-3 text-xs text-neutral-600">
              The entry is still valid; only automated fetching is blocked. This page is built by
              running the real registry command, so it shows the gap instead of hiding it.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-neutral-800 p-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-mono text-base text-neutral-100">{entry.name}</h2>
          <span className="rounded-full border border-neutral-700 px-2 py-0.5 text-[11px] text-neutral-400">
            {entry.library}
          </span>
          <span className="text-[11px] text-neutral-500">{entry.license}</span>
        </div>

        <p className="text-sm text-neutral-400">{entry.effect}</p>

        <div className="flex flex-wrap gap-1.5">
          {entry.aliases.slice(0, 4).map((a) => (
            <span key={a} className="rounded bg-neutral-900 px-1.5 py-0.5 text-[11px] text-neutral-500">
              “{a}”
            </span>
          ))}
        </div>

        <pre className="overflow-x-auto rounded-lg bg-black/60 p-3 text-[11px] leading-relaxed text-neutral-400">
          <code>{entry.ref}</code>
        </pre>

        {entry.deps.length > 0 && (
          <p className="text-[11px] text-neutral-600">deps: {entry.deps.join(", ")}</p>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const entries = showpieces.entries as Entry[];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-white">components</h1>
          <p className="mt-4 text-neutral-400">
            Showpiece React + Tailwind UI for AI coding agents. Describe an effect, and your agent
            fetches the real component live from its registry and adapts it to your brand tokens.
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            Every component below was pulled by running its actual{" "}
            <code className="text-neutral-400">ref</code> command during this page's build. Nothing
            here is copy-pasted, which is the whole point: the registry stores pointers, so the code
            cannot go stale.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <a
              href={REPO}
              className="rounded-lg bg-white px-4 py-2 font-medium text-neutral-950 transition hover:bg-neutral-200"
            >
              GitHub
            </a>
            <code className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-neutral-400">
              npx components-skill@latest add
            </code>
          </div>

          <p className="mt-6 text-xs text-neutral-600">
            A curated sample, one per source library. The full registry has 39 showpieces and 12
            plain fallbacks; see the{" "}
            <a href={REPO} className="underline hover:text-neutral-400">
              README
            </a>
            .
          </p>
        </header>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {entries.map((e) => (
            <Card key={e.name} entry={e} />
          ))}
        </div>

        <footer className="mt-16 border-t border-neutral-800 pt-8 text-xs text-neutral-600">
          <p>
            Each component is governed by its own upstream license, not this repo's Apache-2.0. See{" "}
            <a href={`${REPO}/blob/main/ATTRIBUTION.md`} className="underline hover:text-neutral-400">
              ATTRIBUTION.md
            </a>
            . Demos are shown close to their upstream defaults; the skill's job at use time is to
            adapt them to your tokens and honour{" "}
            <code className="text-neutral-500">prefers-reduced-motion</code>.
          </p>
        </footer>
      </div>
    </main>
  );
}
