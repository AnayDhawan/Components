import { Spotlight } from "@/components/ui/spotlight";

export function DemoSpotlight() {
  return (
    <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
      <p className="relative z-10 text-lg font-medium text-neutral-100">
        Radial spotlight reveal
      </p>
    </div>
  );
}