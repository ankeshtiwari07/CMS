import { getCurrentUser, hasRole } from "@/lib/payload";
import SettingsNav from "@/components/settings/settings-nav";
import UsersClient from "@/components/settings/users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getCurrentUser();
  const admin = hasRole(user, ["admin"]);
  return (
    <>
      <SettingsNav />
      {admin ? (
        <UsersClient meId={user!.id} />
      ) : (
        <div style={{ color: "var(--text-muted)", padding: 24 }}>User management is restricted to administrators.</div>
      )}
    </>
  );
}
