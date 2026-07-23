import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--shell-bg)" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="settings" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0" }}>
        <div style={{ minHeight: "calc(100vh - 20px)", borderRadius: 22, background: "var(--card)", border: "1px solid var(--hairline)", padding: "36px 40px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: "0 0 18px" }}>Settings</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
