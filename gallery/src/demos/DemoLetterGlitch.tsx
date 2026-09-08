const GLYPHS = "アカサタナハマヤラワ0123456789#%&@!";

export function DemoLetterGlitch() {
  return (
    <div className="flex h-56 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-black">
      {Array.from({ length: 4 }, (_, r) => (
        <div key={r} className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: 24 }, (_, c) => (
            <span
              key={c}
              className="font-mono text-xs leading-none"
              style={{ color: `rgba(52,211,153,${0.25 + ((r + c) % 3) * 0.25})` }}
            >
              {GLYPHS[(r * 7 + c * 3) % GLYPHS.length]}
            </span>
          ))}
        </div>
      ))}
      <p className="text-xs text-neutral-500">glitching letter wall</p>
    </div>
  );
}