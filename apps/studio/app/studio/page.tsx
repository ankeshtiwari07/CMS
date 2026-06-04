import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Rail from "@/components/studio/rail";
import PromptBox from "@/components/studio/prompt-box";
import QuickCreate from "@/components/studio/quick-create";

export const metadata = { title: "Create Studio · HUMAIN" };
export const dynamic = "force-dynamic";

function greeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const first = (name || "").split(" ")[0];
  return first ? `${part} ${first}!` : `${part}!`;
}

export default async function StudioHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Rail user={{ name: user.name, email: user.email }} />

      <main style={{ flex: 1, padding: "10px 10px 10px 0" }}>
        <div
          style={{
            minHeight: "calc(100vh - 20px)",
            borderRadius: 22,
            background:
              "linear-gradient(180deg, var(--mint-tint) 0%, #eafaf6 7%, #ffffff 16%, #ffffff 100%)",
            border: "1px solid var(--hairline)",
            padding: "72px 40px 56px",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontSize: 30,
              fontWeight: 700,
              color: "var(--ink)",
              margin: "40px 0 34px",
            }}
          >
            {greeting(user.name)} What do you want to create today?
          </h1>

          <PromptBox />
          <QuickCreate />
        </div>
      </main>
    </div>
  );
}
