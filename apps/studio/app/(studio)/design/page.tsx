import { redirect } from "next/navigation";
import { getCurrentUser, hasRole, payloadFetch } from "@/lib/payload";
import { StudioPageCard } from "@/components/studio/studio-app-shell";
import { HumainWordmark } from "@/components/brand";
import ThemeBuilder, { DEFAULT_THEME, type Theme } from "@/components/design/theme-builder";
import ConsoleFrame from "@/components/studio/console-frame";

export const metadata = { title: "Design System · HUMAIN" };
export const dynamic = "force-dynamic";

const STUDIO = [
  ["Studio Teal / Primary", "var(--primary)"],
  ["Studio Teal Dark", "var(--studio-teal-dark)"],
  ["Mint Tint", "var(--brand-tint)"],
  ["Mint Pill", "var(--brand-pill)"],
  ["Canvas White", "var(--card)"],
  ["Ink Text", "var(--ink)"],
  ["Muted Grey", "var(--text-muted)"],
  ["Hairline", "var(--hairline)"],
];
const CMS = [
  ["Ink / Background", "var(--background)"],
  ["Deep Teal Panel", "var(--deep-teal)"],
  ["Teal Accent", "var(--teal-accent)"],
  ["Lime / Primary CTA", "var(--lime)"],
  ["Lime Dark", "var(--lime-dark)"],
  ["Publish Blue", "var(--publish-blue)"],
  ["Card Mint", "#BFEBC8"],
  ["Surface White", "var(--card)"],
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
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{hex}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function loadTheme(): Promise<Theme> {
  try {
    const res = await payloadFetch("/api/globals/settings?depth=0");
    if (res.ok) {
      const data = await res.json();
      if (data?.theme) return { ...DEFAULT_THEME, ...data.theme };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_THEME };
}

export default async function DesignPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const theme = await loadTheme();
  const canSave = hasRole(user, ["publisher", "admin"]);

  return (
    <ConsoleFrame label="Design" variant="studio">
    <StudioPageCard padding="36px 40px">
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>Design System</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: "0 0 26px" }}>Build your own theme — pick colors, type and radius, watch the live preview, and save it.</p>

      <ThemeBuilder initial={theme} canSave={canSave} />

      <hr style={{ border: "none", borderTop: "1px solid var(--hairline)", margin: "34px 0 28px" }} />

      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", margin: "0 0 4px" }}>Brand reference</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 22px" }}>The default HUMAIN tokens shared by both surfaces.</p>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>Logo</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--hairline)", borderRadius: 12, padding: "22px 28px" }}><HumainWordmark size={26} /></div>
          <div style={{ background: "var(--background)", borderRadius: 12, padding: "22px 28px" }}><HumainWordmark size={26} onDark /></div>
        </div>
      </div>

      <Swatches title="Create Studio — light surface" items={STUDIO} />
      <Swatches title="Content Management — dark surface" items={CMS} />

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>Typography</h3>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: 26, fontWeight: 800, color: "var(--ink)" }}>Inter — UI / Latin <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>The quick brown fox</span></div>
          <div dir="rtl" style={{ fontFamily: "var(--font-ar)", fontSize: 26, fontWeight: 700, color: "var(--ink)" }}>IBM Plex Sans Arabic — العربية <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>تجارب مدعومة بالذكاء الاصطناعي</span></div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", margin: "0 0 12px" }}>Radii &amp; elevation</h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[["Input", 10], ["Card", 18], ["Pill", 999]].map(([l, r]) => (
            <div key={l as string} style={{ textAlign: "center" }}>
              <div style={{ width: 96, height: 64, background: "var(--mint-pill)", border: "1px solid var(--studio-primary)", borderRadius: r as number }} />
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 6 }}>{l} · {r}px</div>
            </div>
          ))}
        </div>
      </div>
    </StudioPageCard>
    </ConsoleFrame>
  );
}
