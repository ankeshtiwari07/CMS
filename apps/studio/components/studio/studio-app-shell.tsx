"use client";
import { AppShell } from "@humain/ui";

/* =============================================================================
   Panel helpers for the Create Studio surfaces.

   The shell that used to live here is gone: /studio and /cms now share ONE
   sidebar, in components/studio/console-shell.tsx. Two shells that shared
   components but not composition is exactly how the two halves of the console
   kept drifting apart. Only the page-body helpers remain here so the surfaces
   that import them keep working.
   ============================================================================= */

export { default } from "@/components/studio/console-shell";

export function StudioPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <AppShell.Panel flex={1} label={label}>
      {children}
    </AppShell.Panel>
  );
}

/**
 * The rounded page card each studio surface declares, in one place.
 *
 * The height is the part that matters: AppShell.Panel is `flex h-full flex-col`
 * with no overflow of its own, so the card owns `height:100%` plus its own
 * scroll. A surface that keeps `minHeight:100vh` inside the panel overflows it
 * by the shell's padding and gives the page a second, outer scrollbar.
 */
export function StudioPageCard({
  padding,
  background = "var(--card)",
  children,
}: {
  padding?: string;
  background?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        borderRadius: 22,
        background,
        border: "1px solid var(--hairline)",
        padding,
      }}
    >
      {children}
    </div>
  );
}
