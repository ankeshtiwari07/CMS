import { StudioPanel, StudioPageCard } from "@/components/studio/studio-app-shell";

export const dynamic = "force-dynamic";

/**
 * Settings keeps a layout of its own — but only for the page card and the
 * "Settings" heading its sub-pages (/settings/general, /users, /access) render
 * inside. The sidebar, the shell and the auth redirect are the route group's job
 * now, so this no longer duplicates them.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudioPanel label="Settings">
      <StudioPageCard padding="36px 40px">
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink)", margin: "0 0 18px" }}>Settings</h1>
        {children}
      </StudioPageCard>
    </StudioPanel>
  );
}
