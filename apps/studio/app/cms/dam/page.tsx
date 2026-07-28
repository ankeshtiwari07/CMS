import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import DamRoute from "@/components/cms/dam-route";

export const dynamic = "force-dynamic";
export const metadata = { title: "Asset Library · HUMAIN" };

// EXPERIMENT: this route builds its shell and panels inside a single client
// component (DamRoute) instead of receiving them through a server boundary.
// See components/cms/dam-route.tsx for what it is testing.
export default async function DamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <DamRoute user={{ name: user.name, email: user.email, roles: user.roles }} />;
}
