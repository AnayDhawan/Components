import { Marquee } from "@/components/ui/marquee";

const ITEMS = ["aceternity", "magicui", "cult-ui", "reactbits", "21st.dev", "shadcn/ui"];

export function DemoMarquee() {
  return (
    <div className="relative w-full overflow-hidden">
      <Marquee pauseOnHover className="[--duration:18s]">
        {ITEMS.map((name) => (
          <div
            key={name}
            className="mx-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm text-neutral-300"
          >
            {name}
          </div>
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="mt-3 [--duration:22s]">
        {ITEMS.map((name) => (
          <div
            key={name}
            className="mx-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm text-neutral-400"
          >
            {name}
          </div>
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-neutral-900/60" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-neutral-900/60" />
    </div>
  );
}
