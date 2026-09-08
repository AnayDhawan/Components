export function DemoHyperspeed() {
  return (
    <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
      <div className="absolute inset-0 opacity-60 [background:repeating-conic-gradient(from_0deg,rgba(148,163,184,0.16)_0deg_1deg,transparent_1deg_7deg)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.3),transparent_60%)]" />
      <p className="relative z-10 text-xs text-neutral-300">hyperspeed light tunnel</p>
    </div>
  );
}