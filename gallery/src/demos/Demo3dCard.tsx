import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

export function Demo3dCard() {
  return (
    <CardContainer className="inter-var">
      <CardBody className="group/card relative h-auto w-auto rounded-xl border border-neutral-800 bg-neutral-950 p-6 sm:w-[22rem]">
        <CardItem translateZ="50" className="text-lg font-bold text-white">
          Tilt me
        </CardItem>
        <CardItem as="p" translateZ="60" className="mt-2 max-w-sm text-sm text-neutral-400">
          The card tracks your cursor and lifts its layers in 3D.
        </CardItem>
        <CardItem translateZ="100" className="mt-5 w-full">
          <div className="h-32 w-full rounded-lg bg-gradient-to-br from-sky-500/30 via-violet-500/20 to-transparent" />
        </CardItem>
        <div className="mt-6 flex items-center justify-between">
          <CardItem translateZ={20} className="rounded-lg px-3 py-1.5 text-xs text-neutral-400">
            aceternity
          </CardItem>
          <CardItem translateZ={20} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black">
            3d-card
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  );
}
