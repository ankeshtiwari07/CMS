"use client";
import { useRouter } from "next/navigation";
import { Button } from "@humain/ui";
import {
  BookOpen,
  Bookmark,
  Building2,
  Calendar,
  CircleHelp,
  CircleUser,
  FileText,
  Images,
  Megaphone,
  Mic,
  Package,
} from "lucide-react";

/* =============================================================================
   Content-type launcher.

   Migrated onto the package per references/adoption.md §4 (Plain HTML/CSS):
   `<button class="...">` -> `Button`. The tiles used to hand-roll their own lime
   gradient, border, shadow and hover lift in inline styles; they now use the
   package's own `appearance="gradient"`, which is the aligned treatment and
   themes with Foundation instead of being a transcribed rgba() pair.

   Icons are lucide, matching cms-app-shell and the rest of the CMS chrome.

   The page title moved OUT of here into the panel's AppShellCard header
   (app/cms/page.tsx), because the package's generated-output contract is
   explicit: use AppShellCard.Header for every titled product panel, and do not
   repeat the card title inside the body.
   ============================================================================= */

// Tiles map to the manage route; the 4 core content types open the tabbed form,
// the rest open a single-type form. `type` is the console content-types key.
const TILES = [
  { type: "blog", label: "BLOG", Icon: FileText },
  { type: "articles", label: "ARTICLE", Icon: BookOpen },
  { type: "press", label: "PRESS RELEASES", Icon: Megaphone },
  { type: "events", label: "EVENTS", Icon: Calendar },
  { type: "products", label: "PRODUCTS", Icon: Package },
  { type: "caseStudies", label: "CASE STUDIES", Icon: Bookmark },
  { type: "faqs", label: "FAQ", Icon: CircleHelp },
  { type: "leadership", label: "LEADERSHIP PROFILES", Icon: CircleUser },
  { type: "careers", label: "CAREERS", Icon: Building2 },
  { type: "mediaGalleries", label: "MEDIA GALLERIES", Icon: Images },
  { type: "campaignMicrosites", label: "CAMPAIGN MICROSITES", Icon: Mic },
];

export default function Launcher() {
  const router = useRouter();
  return (
    // Responsive: the old grid was a hard `repeat(5, 1fr)`, which is a
    // horizontal-overflow risk on narrow viewports.
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {TILES.map(({ type, label, Icon }) => (
        <Button
          key={type}
          appearance="gradient"
          variant="primary"
          onClick={() => router.push(`/cms/manage?type=${type}`)}
          className="h-auto w-full justify-center whitespace-normal p-4 aspect-square"
        >
          {/* ONE child that owns the stack: Button wraps its children in its own
              flex row, so `flex-col` on the Button itself never reaches them and
              the icon sat beside the label instead of above it. */}
          <span className="flex flex-col items-center justify-center gap-3">
            <Icon className="size-7 shrink-0" />
            <span className="text-center text-xs font-bold uppercase leading-tight">
              {label}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}
