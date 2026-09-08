export function DemoGlobe() {
  return (
    <div className="flex h-56 w-full items-center justify-center">
      <div className="relative h-44 w-44">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_30%,#7dd3fc,#0ea5e9_55%,#082f49)] shadow-[0_0_60px_rgba(56,189,248,0.35)]" />
        <div className="absolute inset-0 rounded-full [background:repeating-linear-gradient(0deg,rgba(255,255,255,0.22)_0px_1px,transparent_1px_11px),repeating-linear-gradient(90deg,rgba(255,255,255,0.18)_0px_1px,transparent_1px_11px)]" />
        <div className="absolute inset-0 rounded-full [background:radial-gradient(circle_at_72%_22%,rgba(2,6,23,0.5),transparent_55%)]" />
      </div>
    </div>
  );
}