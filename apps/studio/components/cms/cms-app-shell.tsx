"use client";
import { AppShell, AppShellCard } from "@humain/ui";
import type { ShellUser } from "@/components/studio/sidebar-account-menu";

/* =============================================================================
   Panel helpers for the CMS surfaces.

   The CMS sidebar that used to live here is gone — the console has ONE shell now
   (components/studio/console-shell.tsx), with the CMS as a nav row whose
   children are the section's own pages. Only the panel helpers remain.
   ============================================================================= */

export type CmsUser = ShellUser;
export { default } from "@/components/studio/console-shell";

/**
 * A bare AppShell.Panel: every CMS workspace already draws its own card chrome
 * and is a full-height flex layout with internal scrollers, so wrapping it in
 * AppShellCard would nest card-in-card and mis-compute those scroll regions.
 */
export function CmsPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <AppShell.Panel flex={1} label={label}>
      {children}
    </AppShell.Panel>
  );
}

/** Card-wrapped panel, per the recipe, for content that has no chrome of its own. */
export function CmsCardPanel({
  title,
  subtitle,
  label,
  bodyPadding = "md",
  children,
}: {
  title: string;
  subtitle?: string;
  label?: string;
  bodyPadding?: "none" | "md";
  children: React.ReactNode;
}) {
  return (
    <AppShell.Panel flex={1} label={label ?? title}>
      <AppShellCard bodyPadding={bodyPadding}>
        <AppShellCard.Header>
          <AppShellCard.Title>{title}</AppShellCard.Title>
          {subtitle ? <AppShellCard.Subtitle>{subtitle}</AppShellCard.Subtitle> : null}
        </AppShellCard.Header>
        {children}
      </AppShellCard>
    </AppShell.Panel>
  );
}
