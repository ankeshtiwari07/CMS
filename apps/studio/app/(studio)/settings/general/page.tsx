import { getCurrentUser, hasRole } from "@/lib/payload";
import SettingsNav from "@/components/settings/settings-nav";
import GeneralClient from "@/components/settings/general-client";

export const dynamic = "force-dynamic";

export default async function GeneralPage() {
  const user = await getCurrentUser();
  return (
    <>
      <SettingsNav />
      <GeneralClient canEdit={hasRole(user, ["publisher", "admin"])} />
    </>
  );
}
