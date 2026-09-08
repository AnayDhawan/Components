import { Dock, DockIcon } from "@/components/ui/dock";

const ITEMS = ["Mail", "Browser", "Code", "Shell", "Media", "Settings"];

export function DemoDock() {
  return (
    <Dock className="bg-white/5">
      {ITEMS.map((label, i) => (
        <DockIcon key={label}>
          <span className="text-base font-medium text-neutral-100">{label.slice(0, 2)}</span>
          <span className="sr-only">{label} icon at index {i}</span>
        </DockIcon>
      ))}
    </Dock>
  );
}