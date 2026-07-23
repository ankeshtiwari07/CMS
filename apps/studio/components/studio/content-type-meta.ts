import {
  MonitorIcon, ImageIcon, GlobeIcon, MailIcon, PaletteIcon, FileIcon, TranslateIcon,
  CalendarIcon, MegaphoneIcon, BookmarkIcon, CodeIcon, VideoIcon, BuildingIcon,
} from "@/components/icons";

/**
 * Label / icon / tile art per content type. Shared by the Projects grid and the
 * Continue-creating rail, which previously kept two copies of this table.
 *
 * The tile gradients are a CATEGORICAL palette — one hue per content type, so a
 * type is recognisable at a glance. Each is a tint of a HUMAIN Foundation ramp
 * mixed over the themed background rather than a fixed pastel, so the tiles
 * darken in dark mode. That matters: the icon and label drawn on top use themed
 * colours, and against a permanently-pale tile they would disappear.
 */
const tile = (ramp: string, from = 16, to = 28) =>
  `linear-gradient(135deg, color-mix(in srgb, var(--${ramp}) ${from}%, var(--background)), ` +
  `color-mix(in srgb, var(--${ramp}) ${to}%, var(--background)))`;

export type ContentTypeMeta = { label: string; Icon: any; grad: string };

export const META: Record<string, ContentTypeMeta> = {
  deck: { label: "DECK", Icon: MonitorIcon, grad: tile("green-400") },
  image: { label: "IMAGE", Icon: ImageIcon, grad: tile("lime-400") },
  website: { label: "WEBSITE", Icon: GlobeIcon, grad: tile("air-400") },
  email: { label: "EMAIL", Icon: MailIcon, grad: tile("neutral-400", 10, 20) },
  brand: { label: "BRAND", Icon: PaletteIcon, grad: tile("emerald-400") },
  designSystem: { label: "DESIGN SYSTEM", Icon: PaletteIcon, grad: tile("oasis-400") },
  writing: { label: "WRITING", Icon: FileIcon, grad: tile("stone-400", 12, 22) },
  translation: { label: "TRANSLATION", Icon: TranslateIcon, grad: tile("amber-400") },
  event: { label: "EVENT", Icon: CalendarIcon, grad: tile("emerald-400", 12, 22) },
  webinar: { label: "WEBINAR", Icon: MonitorIcon, grad: tile("cyan-400") },
  conference: { label: "CONFERENCE", Icon: CalendarIcon, grad: tile("sky-400") },
  summit: { label: "SUMMIT", Icon: BuildingIcon, grad: tile("lime-400", 12, 22) },
  campaign: { label: "CAMPAIGN", Icon: MegaphoneIcon, grad: tile("orange-400") },
  brandGuideline: { label: "BRAND GUIDELINE", Icon: BookmarkIcon, grad: tile("green-400", 12, 22) },
  websiteBuild: { label: "WEBSITE BUILD", Icon: CodeIcon, grad: tile("air-400", 12, 22) },
  // Video keeps a deep, saturated brand gradient — it reads as a film still.
  video: { label: "VIDEO", Icon: VideoIcon, grad: "linear-gradient(135deg, var(--air-900), var(--air-700))" },
};

export default META;
