"use client";
import { useState } from "react";
import { AppShellCard, Button, LoadingIndicator } from "@humain/ui";
import { ExternalLink } from "lucide-react";

/* =============================================================================
   Embeds a Payload admin view inside the HUMAIN CMS chrome. Same-origin iframe
   (cms host) authenticated by the shared `payload-token` cookie set at console
   login — so admins manage the full Payload surface WITHOUT a second login.

   Migrated onto @humain/ui: the hand-rolled card, the gradient header strip and
   the plain-text loading state become AppShellCard + Button + LoadingIndicator.
   The iframe itself is untouched — the package has no equivalent, and shouldn't.
   ============================================================================= */

export default function AdminFrame({ src, title }: { src: string; title: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <AppShellCard bodyPadding="none">
      <AppShellCard.Toolbar>
        <AppShellCard.Header>
          <AppShellCard.Title>HUMAIN CMS Admin</AppShellCard.Title>
          <AppShellCard.Subtitle>{title}</AppShellCard.Subtitle>
        </AppShellCard.Header>
        <AppShellCard.Actions>
          <Button
            appearance="outline"
            variant="secondary"
            size="sm"
            endIcon={<ExternalLink className="size-4" />}
            render={<a href={src} target="_blank" rel="noreferrer" />}
          >
            Open full
          </Button>
        </AppShellCard.Actions>
      </AppShellCard.Toolbar>

      <div className="relative min-h-0 flex-1">
        {loading && (
          <div className="absolute inset-0 grid place-items-center gap-2 text-sm text-secondary-foreground">
            <LoadingIndicator />
            <span>Loading {title}…</span>
          </div>
        )}
        <iframe src={src} title={title} onLoad={() => setLoading(false)} className="size-full border-0" />
      </div>
    </AppShellCard>
  );
}
