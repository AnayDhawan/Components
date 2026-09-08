export function DemoAurora() {
  return (
    <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">
      <div className="absolute -left-1/3 -top-1/4 h-2/3 w-2/3 rotate-12 rounded-[100%] bg-gradient-to-b from-emerald-300/50 via-cyan-400/25 to-transparent blur-3xl" />
      <div className="absolute -right-1/3 top-1/4 h-2/3 w-2/3 -rotate-12 rounded-[100%] bg-gradient-to-t from-fuchsia-400/40 via-indigo-400/25 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-1/2 w-1/2 rotate-6 rounded-[100%] bg-gradient-to-b from-sky-400/40 to-transparent blur-3xl" />
      <p className="relative z-10 text-xs text-neutral-300">aurora ribbon background</p>
    </div>
  );
}