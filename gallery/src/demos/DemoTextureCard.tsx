export function DemoTextureCard() {
  return (
    <div className="relative h-56 w-64 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900">
      <div className="absolute inset-px rounded-2xl bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.14),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(99,102,241,0.18),transparent_50%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative m-4 rounded-xl border border-white/10 bg-neutral-950/60 p-4">
        <div className="h-16 w-full rounded-lg bg-gradient-to-br from-neutral-700 to-neutral-800" />
        <div className="mt-3 h-2 w-3/4 rounded bg-neutral-700" />
        <div className="mt-2 h-2 w-1/2 rounded bg-neutral-800" />
      </div>
    </div>
  );
}