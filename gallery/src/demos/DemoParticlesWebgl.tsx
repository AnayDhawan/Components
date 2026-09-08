export function DemoParticlesWebgl() {
  return (
    <div className="flex h-56 w-full flex-col items-center justify-center gap-3">
      <div className="flex w-60 flex-wrap justify-center gap-1.5">
        {Array.from({ length: 80 }, (_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: `rgba(148,163,184,${0.25 + ((i * 7) % 5) * 0.15})` }}
          />
        ))}
      </div>
      <p className="text-xs text-neutral-500">GPU particle field</p>
    </div>
  );
}