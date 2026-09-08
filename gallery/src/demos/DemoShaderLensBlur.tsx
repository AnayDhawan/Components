export function DemoShaderLensBlur() {
  return (
    <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">
      <div className="absolute flex items-center justify-center gap-4 opacity-80">
        <div className="h-24 w-24 rounded-2xl bg-sky-500/70 blur-md" />
        <div className="h-24 w-24 rounded-2xl bg-fuchsia-500/70 blur-md" />
        <div className="h-24 w-24 rounded-2xl bg-amber-400/70 blur-md" />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-white/10 px-8 py-6 backdrop-blur-lg">
        <p className="text-sm font-medium text-white">lens-blur shader surface</p>
      </div>
    </div>
  );
}