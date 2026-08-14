import BlurText from "@/components/BlurText";

export function DemoBlurText() {
  return (
    <BlurText
      text="Words blur into focus, one at a time."
      delay={120}
      animateBy="words"
      direction="top"
      className="max-w-sm text-center text-2xl font-medium text-white"
    />
  );
}
