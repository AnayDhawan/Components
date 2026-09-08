import { BackgroundBeams } from "@/components/ui/background-beams";

export function DemoBackgroundBeams() {
  return (
    <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">
      <BackgroundBeams />
      <p className="relative z-10 text-sm text-neutral-300">Animated SVG light beams</p>
    </div>
  );
}