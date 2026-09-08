export function DemoCanvasFractalGrid() {
  return (
    <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">
      <div className="absolute inset-x-0 bottom-0 h-40 [transform:perspective(500px)_rotateX(55deg)] [transform-origin:bottom] [background:linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute inset-x-0 bottom-0 h-40 animate-pulse [transform:perspective(500px)_rotateX(55deg)] [transform-origin:bottom] [background:radial-gradient(circle_at_center,rgba(99,102,241,0.35),transparent_60%)]" />
      <p className="absolute bottom-3 text-xs text-neutral-400">animated canvas grid</p>
    </div>
  );
}