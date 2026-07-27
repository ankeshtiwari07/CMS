"use client";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  NavAccountMenu,
  NavAccountMenuContent,
  NavAccountMenuFooter,
  NavAccountMenuHeader,
  NavAccountMenuItem,
  NavAccountMenuSection,
  NavAccountMenuSeparator,
  NavAccountMenuTrigger,
  useSidebar,
} from "@humain/ui";
import { LogOut, Settings } from "lucide-react";
import ThemeToggle from "@/components/studio/theme-toggle";
import { LanguageSwitcher, useT } from "@/lib/i18n-client";

/* =============================================================================
   Sidebar account footer — ONE component, shared by Create Studio and the CMS.

   This is the package's documented profile-card pattern (NavAccountMenu), which
   the skill is explicit about: "Do not hand-roll a profile/settings/sign-out
   menu from raw divs, Card, or loose Button blocks." The old studio sidebar did
   exactly that in ~80 lines of inline styles.

   Sharing it also closes a real gap rather than only moving code: the CMS shell
   rendered a bare AppSidebar.Account whose only action was onExpand -> /settings,
   so /cms had no way to sign out, switch language or change theme. Both shells
   now get the same four.
   ============================================================================= */

export type ShellUser = { name?: string; email: string; roles?: string[] };

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  siteAdmin: "Site Administrator",
  compliance: "Legal / Compliance",
  publisher: "Publisher",
  reviewer: "Reviewer",
  author: "Author",
  brand: "Brand",
  viewer: "Viewer",
};

export function roleLabel(user: ShellUser) {
  return (user.roles ?? []).map((r) => ROLE_LABEL[r]).find(Boolean) ?? "Member";
}

export default function SidebarAccountMenu({ user }: { user: ShellUser }) {
  const router = useRouter();
  const t = useT();
  // Collapsed rail: the trigger drops to avatar-only via the package's own
  // `compact` prop instead of us re-implementing a narrow variant.
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const name = user.name || user.email;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <NavAccountMenu type="card">
      <NavAccountMenuTrigger
        avatar={<Avatar fallback={name} alt={name} size="sm" indicator="online" />}
        name={name}
        email={roleLabel(user)}
        compact={collapsed}
      />
      <NavAccountMenuContent side="right" align="end">
        {/* The trigger's second line is the ROLE, per the target design; the
            email moves into the menu header so the identity is still one click
            away rather than gone. */}
        <NavAccountMenuHeader title={name} subtitle={user.email} />
        <NavAccountMenuSeparator />

        {/* Language — the existing switcher navigates to the /<locale>/… URL so
            middleware can re-align chrome + RTL. That is a full-width control,
            not a menu row, so it sits in a labelled section. */}
        <NavAccountMenuSection label={t("menu.language")}>
          <LanguageSwitcher />
        </NavAccountMenuSection>
        <NavAccountMenuSeparator />

        <NavAccountMenuSection>
          <NavAccountMenuItem icon={<Settings />} onSelect={() => router.push("/settings")}>
            {t("menu.settings")}
          </NavAccountMenuItem>
        </NavAccountMenuSection>
        <NavAccountMenuSeparator />

        {/* DELIBERATE deviation from NavAccountMenuThemeSwitch: that control is a
            two-state boolean (checked = dark). This app's theme is tri-state
            (light | dark | system) and lib/theme.ts keeps the CHOICE and the
            RESOLVED value in two separate keys on purpose. A boolean switch
            cannot express "system", and writing to it would bypass the
            data-theme/THEME_EVENT contract that ThemeSync depends on. So the
            app's own tri-state control stays, inside the package's section. */}
        <NavAccountMenuSection label={t("menu.theme")}>
          <ThemeToggle />
        </NavAccountMenuSection>
        <NavAccountMenuSeparator />

        <NavAccountMenuFooter>
          <Button
            variant="primary"
            shape="rounded"
            className="w-full gap-2"
            onClick={signOut}
          >
            <LogOut className="size-4" />
            {t("menu.signout")}
          </Button>
        </NavAccountMenuFooter>
      </NavAccountMenuContent>
    </NavAccountMenu>
  );
}
