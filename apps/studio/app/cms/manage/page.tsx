import { redirect } from "next/navigation";
import { getCurrentUser, hasRole } from "@/lib/payload";
import TopBar from "@/components/cms/topbar";
import ContentManager from "@/components/cms/content-manager";

export const metadata = { title: "Content Management · HUMAIN" };
export const dynamic = "force-dynamic";

const CMS_BG = [
  "radial-gradient(900px 380px at 88% -8%, rgba(157,191,45,0.18), transparent 60%)",
  "linear-gradient(115deg, transparent 46%, rgba(17,81,90,0.55) 58%, transparent 60%)",
  "linear-gradient(115deg, transparent 54%, rgba(120,170,120,0.30) 66%, transparent 70%)",
  "linear-gradient(115deg, transparent 62%, rgba(194,229,75,0.18) 74%, transparent 80%)",
  "linear-gradient(180deg, #0e2a2e 0%, #0b1416 42%)",
].join(",");

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { type } = await searchParams;
  const canEdit = hasRole(user, ["author", "reviewer", "publisher", "brand", "siteAdmin", "admin"]);
  const canPublish = hasRole(user, ["publisher", "siteAdmin", "admin"]);
  return (
    <div style={{ minHeight: "100vh", background: "var(--cms-bg)" }}>
      <TopBar user={{ name: user.name, email: user.email }} />
      <div style={{ minHeight: "calc(100vh - 60px)", backgroundColor: "var(--cms-bg)", backgroundImage: CMS_BG, backgroundRepeat: "no-repeat" }}>
        <ContentManager initialType={type || "blog"} canEdit={canEdit} canPublish={canPublish} />
      </div>
    </div>
  );
}
