export function DemoSplashCursor() {
  return (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-neutral-950">
      <div className="absolute -left-8 top-6 h-44 w-44 rounded-full bg-gradient-to-br from-fuchsia-500/60 via-transparent to-transparent blur-2xl" />
      <div className="absolute -top-10 left-1/3 h-40 w-40 rounded-full bg-gradient-to-br from-cyan-400/50 to-transparent blur-2xl" />
      <div className="absolute -bottom-6 right-8 h-48 w-48 rounded-full bg-gradient-to-tl from-indigo-500/60 to-transparent blur-2xl" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-xl" />
      <p className="absolute inset-x-0 bottom-4 text-center text-xs text-neutral-400">
        fluid trails follow the cursor
      </p>
    </div>
  );
}