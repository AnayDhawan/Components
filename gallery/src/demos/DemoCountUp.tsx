import CountUp from "@/components/CountUp";

export function DemoCountUp() {
  return (
    <div className="flex flex-col items-center gap-2">
      <CountUp
        to={128730}
        duration={2.4}
        separator=","
        className="text-4xl font-semibold text-white"
      />
      <p className="text-xs text-neutral-500">counts up when scrolled into view</p>
    </div>
  );
}