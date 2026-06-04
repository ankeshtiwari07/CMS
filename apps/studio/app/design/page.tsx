import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/payload";
import Sidebar from "@/components/studio/sidebar";
import { HumainWordmark } from "@/components/brand";

export const metadata = { title: "Design System · HUMAIN" };
export const dynamic = "force-dynamic";

const STUDIO = [
  ["Studio Teal / Primary", "#00A18B"],
  ["Studio Teal Dark", "#0E7C6B"],
  ["Mint Tint", "#CEEBE7"],
  ["Mint Pill", "#E4F4F0"],
  ["Canvas White", "#FFFFFF"],
  ["Ink Text", "#1A1A1A"],
  ["Muted Grey", "#6B7280"],
  ["Hairline", "#E6E8EB"],
];
const CMS = [
  ["Ink / Background", "#0B1416"],
  ["Deep Teal Panel", "#0E2A2E"],
  ["Teal Accent", "#11515A"],
  ["Lime / Primary CTA", "#C2E54B"],
  ["Lime Dark", "#9DBF2D"],
  ["Publish Blue", "#103B47"],
  ["Card Mint", "#BFEBC8"],
  ["Surface White", "#FFFFFF"],
];

function Swatches({ title, items }: { title: string; items: string[][] }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14 }}>
        {items.map(([name, hex]) => (
          <div key={name} style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ height: 64, background: hex, borderBottom: "1px solid var(--hairline)" }} />
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{hex}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DesignPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef4f3" }}>
      <Sidebar user={{ name: user.name, email: user.email, roles: user.roles }} active="design" />
      <main style={{ flex: 1, padding: "10px 10px 10px 0" }}>
        <div style={{ minHeight: "calc(100vh - 20px)", borderRadius: 22, background: "#fff", border: "1px solid var(--hairline)", padding: "36px 40px" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>Design System</h1>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 26px" }}>HUMAIN brand tokens — the single source of truth shared by both surfaces.</p>

          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>Logo</h3>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ background: "#fff", border: "1px solid var(--hairline)", borderRadius: 12, padding: "22px 28px" }}><HumainWordmark size={26} /></div>
              <div style={{ background: "#0b1416", borderRadius: 12, padding: "22px 28px" }}><HumainWordmark size={26} onDark /></div>
            </div>
          </div>

          <Swatches title="Create Studio — light surface" items={STUDIO} />
          <Swatches title="Content Management — dark surface" items={CMS} />

          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>Typography</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: 26, fontWeight: 800, color: "var(--ink)" }}>Inter — UI / Latin <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>The quick brown fox</span></div>
              <div dir="rtl" style={{ fontFamily: "var(--font-ar)", fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>IBM Plex Sans Arabic — العربية <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)" }}>تجارب مدعومة بالذكاء الاصطناعي</span></div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>Radii &amp; elevation</h3>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[["Input", 10], ["Card", 18], ["Pill", 999]].map(([l, r]) => (
                <div key={l as string} style={{ textAlign: "center" }}>
                  <div style={{ width: 96, height: 64, background: "var(--mint-pill)", border: "1px solid var(--studio-primary)", borderRadius: r as number }} />
                  <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>{l} · {r}px</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
