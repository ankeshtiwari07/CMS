import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import ReviewQueue from "@/components/review/review-queue";

export const metadata = { title: "Review Queue · HUMAIN" };
export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const approver = hasRole(user, ["reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"]);
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="review" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0" }}>
        <div style={{ minHeight: "calc(100vh - 20px)", borderRadius: 22, background: "#fff", border: "1px solid var(--hairline)" }}>
          {approver ? (
            <ReviewQueue />
          ) : (
            <div style={{ padding: 40, color: "var(--muted)" }}>The Review Queue is for approver roles (reviewer, brand, compliance, publisher, admin).</div>
          )}
        </div>
      </main>
    </div>
  );
}
