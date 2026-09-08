import DecryptedText from "@/components/DecryptedText";

export function DemoDecryptedText() {
  return (
    <DecryptedText
      text="HACKER_TEXT"
      animateOn="view"
      sequential
      speed={35}
      className="font-mono text-2xl font-medium text-emerald-300"
      encryptedClassName="font-mono text-2xl text-neutral-500"
    />
  );
}