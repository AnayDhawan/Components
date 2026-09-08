import { Meteors } from "@/components/ui/meteors";

export function DemoMeteors() {
  return (
    <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">
      <Meteors number={30} />
      <p className="relative z-10 text-sm text-neutral-300">Meteor shower background</p>
    </div>
  );
}