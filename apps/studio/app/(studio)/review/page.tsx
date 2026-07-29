import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/payload";
import { StudioPageCard } from "@/components/studio/studio-app-shell";
import ReviewQueue from "@/components/review/review-queue";
import ConsoleFrame from "@/components/studio/console-frame";

export const metadata = { title: "Review Queue · HUMAIN" };
export const dynamic = "force-dynamic";

// The role check stays here: the layout gates on being signed in, this gates on
// being an approver. Card padding stays off — ReviewQueue draws its own.
export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const approver = hasRole(user, ["reviewer", "publisher", "brand", "siteAdmin", "compliance", "admin"]);
  return (
    <ConsoleFrame label="Review" variant="studio">
    <StudioPageCard>
      {approver ? (
        <ReviewQueue />
      ) : (
        <div style={{ padding: 40, color: "var(--text-muted)" }}>The Review Queue is for approver roles (reviewer, brand, compliance, publisher, admin).</div>
      )}
    </StudioPageCard>
    </ConsoleFrame>
  );
}
