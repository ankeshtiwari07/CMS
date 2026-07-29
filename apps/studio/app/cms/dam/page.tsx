import ConsoleFrame from "@/components/studio/console-frame";
import DamStudio from "@/components/studio/dam-studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Asset Library · HUMAIN" };

export default async function DamPage() {
  return (
    <ConsoleFrame label="Asset Library" surface="dam">
      <DamStudio />
    </ConsoleFrame>
  );
}
