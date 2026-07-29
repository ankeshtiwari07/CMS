import { getCurrentUser, hasRole } from "@/lib/payload";
import SettingsNav from "@/components/settings/settings-nav";
import GeneralClient from "@/components/settings/general-client";
import ConsoleFrame from "@/components/studio/console-frame";

export const dynamic = "force-dynamic";

export default async function GeneralPage() {
  const user = await getCurrentUser();
  return (
    <ConsoleFrame label="General" variant="studio">
        <SettingsNav />
        <GeneralClient canEdit={hasRole(user, ["publisher", "admin"])} />
    </ConsoleFrame>
  );
}
