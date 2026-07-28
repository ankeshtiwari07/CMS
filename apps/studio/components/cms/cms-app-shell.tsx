"use client";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, AppShellCard, Button } from "@humain/ui";
import { CMS_SECTION } from "@/components/studio/console-shell";
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
 * The CMS section's own navigation.
 *
 * The sidebar shows CMS as a single flat row, per the design, so the section's
 * pages — Pages, Content, Website, Decks, Components, Data, Assets, Governance —
 * are navigated from here. Rendering it inside CmsPanel means every /cms surface
 * gets it from one place rather than each page wiring its own.
 */
export function CmsSectionNav() {
  const pathname = usePathname() || "";
  const router = useRouter();
  // One line that scrolls horizontally rather than wrapping: in the two-panel
  // surfaces this rail is only ~40% of the viewport, and flex-wrap turned it
  // into two stacked rows.
  return (
    <nav aria-label="CMS sections" className="mb-3 flex shrink-0 gap-1 overflow-x-auto">
      {CMS_SECTION.map((s) => {
        const active = s.href === "/cms" ? pathname === "/cms" : pathname.startsWith(s.href);
        return (
          <Button
            key={s.href}
            size="sm"
            appearance={active ? "soft" : "ghost"}
            variant={active ? "primary" : "secondary"}
            className="shrink-0"
            onClick={() => router.push(s.href)}
          >
            {s.label}
          </Button>
        );
      })}
    </nav>
  );
}

/**
 * A bare AppShell.Panel: every CMS workspace already draws its own card chrome
 * and is a full-height flex layout with internal scrollers, so wrapping it in
 * AppShellCard would nest card-in-card and mis-compute those scroll regions.
 * The section nav sits above as a fixed row; the workspace takes the remainder.
 */
export function CmsPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <AppShell.Panel flex={1} label={label}>
      <CmsSectionNav />
      <div className="min-h-0 flex-1">{children}</div>
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
      <CmsSectionNav />
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
