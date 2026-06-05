// Seeded brand-guideline library: the real HUMAIN guideline + curated enterprise
// archetypes the Brand Studio suggests based on a user's industry/need. Each is a
// full guideline of editable sections, a palette, and typography — users can adopt
// a whole guideline or pull individual sections into their own.

export type BGSection = { id: string; type: string; title: string; content: string };
export type BGPalette = { name: string; hex: string; usage?: string };
export type BGGuideline = {
  key: string;
  name: string;
  industry: string;
  summary: string;
  source: "humain" | "archetype";
  sections: BGSection[];
  palette: BGPalette[];
  typography: { headline: string; body: string; notes?: string };
};

const S = (type: string, title: string, content: string): BGSection => ({ id: type, type, title, content });

export const HUMAIN_GUIDELINE: BGGuideline = {
  key: "humain",
  name: "HUMAIN",
  industry: "Sovereign AI / National Technology",
  summary: "Saudi Arabia's homegrown, sovereign AI brand — confident, human-centered, and built for the Kingdom and the world.",
  source: "humain",
  sections: [
    S("essence", "Brand Essence", "Sovereign intelligence, humanized. AI that keeps a nation's data, decisions, and destiny firmly in its own hands."),
    S("positioning", "Positioning", "HUMAIN is the Kingdom's end-to-end AI champion — full-stack sovereign infrastructure, Arabic-first models, and enterprise solutions that advance Vision 2030 while serving the world."),
    S("personality", "Personality & Values", "Confident, not loud. Human, not cold. Pioneering, sovereign, trustworthy, and globally ambitious. We lead with capability and humility."),
    S("voice", "Voice & Tone", "Clear, declarative, and optimistic. DO: speak plainly, lead with outcomes, honor Arabic and English equally. DON'T: hype, jargon-stack, or over-promise. Bilingual by default."),
    S("messaging", "Messaging Pillars", "1) Sovereign by design — data and models stay in the Kingdom. 2) Arabic-first intelligence. 3) Full-stack, from compute to applications. 4) Built for nations and enterprises alike."),
    S("logo", "Logo Usage", "The HUMAIN wordmark with the signature double-bar H. DO: maintain clear space, use the single-color mark (ink on light, white on dark). DON'T: recolor, stretch, add effects, or place on busy imagery."),
    S("imagery", "Imagery & Art Direction", "Human moments meeting advanced technology; warm, natural light; real people; Saudi context shown with pride and modernity. Avoid generic stock and cold sci-fi clichés."),
    S("applications", "Example Applications", "Keynote decks, product UI (Create Studio teal), sovereign-cloud collateral, bilingual web, and event branding — always with generous whitespace and the teal/lime accent system."),
  ],
  palette: [
    { name: "Studio Teal / Primary", hex: "#00A18B", usage: "Primary brand & CTAs" },
    { name: "Teal Dark", hex: "#0E7C6B", usage: "Hover / depth" },
    { name: "Lime Accent", hex: "#C2E54B", usage: "Highlights / CMS CTA" },
    { name: "Ink", hex: "#0B1416", usage: "Text / dark surfaces" },
    { name: "Mint Tint", hex: "#CEEBE7", usage: "Soft backgrounds" },
    { name: "Canvas White", hex: "#FFFFFF", usage: "Base surface" },
  ],
  typography: { headline: "Inter (Bold, tight tracking)", body: "Inter (Regular)", notes: "IBM Plex Sans Arabic for Arabic/RTL." },
};

const ARCHETYPES: BGGuideline[] = [
  {
    key: "sovereign",
    name: "Sovereign / National Digital",
    industry: "Government & National Programs",
    summary: "Authority, trust, and continuity for national-scale digital and AI programs.",
    source: "archetype",
    sections: [
      S("essence", "Brand Essence", "A nation's trusted digital backbone — secure, enduring, and built for every citizen."),
      S("positioning", "Positioning", "The official, sovereign platform that keeps national data and services under national control while delivering world-class experiences."),
      S("personality", "Personality & Values", "Authoritative, transparent, inclusive, and stable. Gravitas without coldness."),
      S("voice", "Voice & Tone", "Formal but accessible. Reassuring and precise. Bilingual, accessible, and plain-language first."),
      S("messaging", "Messaging Pillars", "Sovereignty · Security & trust · Citizen-first service · Long-term continuity."),
      S("logo", "Logo Usage", "Protect the emblem with generous clear space; single-color on official documents; never decorative."),
      S("imagery", "Imagery & Art Direction", "Real citizens, civic spaces, national landmarks; dignified, optimistic, documentary lighting."),
      S("applications", "Example Applications", "Portals, official documents, signage, public dashboards, ministerial decks."),
    ],
    palette: [
      { name: "Sovereign Green", hex: "#1A7A4C", usage: "Primary" },
      { name: "Deep Navy", hex: "#0E2342", usage: "Authority / text" },
      { name: "Gold", hex: "#C9A227", usage: "Emblem accent" },
      { name: "Stone", hex: "#F2EFE9", usage: "Background" },
    ],
    typography: { headline: "Tajawal / Frutiger-style sans", body: "Tajawal Regular", notes: "Strong Arabic parity, high legibility." },
  },
  {
    key: "enterprise-saas",
    name: "Enterprise SaaS / Tech",
    industry: "B2B Software",
    summary: "Clean, confident, product-led — clarity and momentum for modern software.",
    source: "archetype",
    sections: [
      S("essence", "Brand Essence", "Software that just works — powerful under the hood, effortless on the surface."),
      S("positioning", "Positioning", "The platform teams trust to ship faster, with enterprise-grade security and a delightful product experience."),
      S("personality", "Personality & Values", "Smart, direct, helpful, optimistic. Confidence earned through clarity."),
      S("voice", "Voice & Tone", "Crisp and benefit-led. Active voice, short sentences, concrete outcomes. Friendly, never cutesy."),
      S("messaging", "Messaging Pillars", "Speed · Reliability · Security · Loved by users."),
      S("logo", "Logo Usage", "Wordmark + simple geometric glyph. Plenty of clear space; mono on dark."),
      S("imagery", "Imagery & Art Direction", "Product UI close-ups, abstract gradients, diverse teams at work; bright and uncluttered."),
      S("applications", "Example Applications", "Landing pages, in-product UI, sales decks, docs, conference booths."),
    ],
    palette: [
      { name: "Indigo", hex: "#4F46E5", usage: "Primary" },
      { name: "Sky", hex: "#0EA5E9", usage: "Accent" },
      { name: "Ink", hex: "#0F172A", usage: "Text" },
      { name: "Cloud", hex: "#F8FAFC", usage: "Background" },
    ],
    typography: { headline: "Inter / Geist (Semibold)", body: "Inter (Regular)", notes: "Tabular numerals for data UIs." },
  },
  {
    key: "financial",
    name: "Financial Services",
    industry: "Banking & Fintech",
    summary: "Trust, stability, and premium assurance for money and markets.",
    source: "archetype",
    sections: [
      S("essence", "Brand Essence", "Confidence you can bank on — security and growth, made simple."),
      S("positioning", "Positioning", "A trusted partner for wealth and everyday finance, blending institutional strength with modern, human service."),
      S("personality", "Personality & Values", "Trustworthy, precise, discreet, forward-looking."),
      S("voice", "Voice & Tone", "Reassuring and exact. Transparent about value and risk. Never flashy with people's money."),
      S("messaging", "Messaging Pillars", "Security · Transparency · Growth · Personal service."),
      S("logo", "Logo Usage", "Solid, balanced mark; protected clear space; mono on statements."),
      S("imagery", "Imagery & Art Direction", "Calm, aspirational lifestyle; clean data visualizations; deep navy and gold restraint."),
      S("applications", "Example Applications", "Apps, statements, branch signage, investor materials."),
    ],
    palette: [
      { name: "Navy", hex: "#0B2545", usage: "Primary" },
      { name: "Gold", hex: "#B8860B", usage: "Premium accent" },
      { name: "Slate", hex: "#334155", usage: "Text" },
      { name: "Porcelain", hex: "#F5F7FA", usage: "Background" },
    ],
    typography: { headline: "Serif display (e.g. Lora) or geometric sans", body: "Source Sans", notes: "Serif headlines signal trust; sans body for clarity." },
  },
  {
    key: "luxury",
    name: "Luxury / Premium",
    industry: "Luxury & Hospitality",
    summary: "Restraint, elegance, and craft — the brand whispers, never shouts.",
    source: "archetype",
    sections: [
      S("essence", "Brand Essence", "Quiet excellence — every detail considered, nothing superfluous."),
      S("positioning", "Positioning", "An icon of taste and craftsmanship for those who value the exceptional and discreet."),
      S("personality", "Personality & Values", "Refined, timeless, confident, understated."),
      S("voice", "Voice & Tone", "Spare and evocative. Few words, perfectly chosen. Sensory, never salesy."),
      S("messaging", "Messaging Pillars", "Craft · Heritage · Exclusivity · Experience."),
      S("logo", "Logo Usage", "Monogram or elegant wordmark; maximal clear space; gold-foil or mono only."),
      S("imagery", "Imagery & Art Direction", "Editorial photography, deep shadows, texture and material focus; monochrome with a single metallic accent."),
      S("applications", "Example Applications", "Lookbooks, packaging, boutique signage, invitations."),
    ],
    palette: [
      { name: "Onyx", hex: "#111111", usage: "Primary" },
      { name: "Champagne Gold", hex: "#C5A572", usage: "Accent" },
      { name: "Bone", hex: "#EDE8E0", usage: "Background" },
      { name: "Graphite", hex: "#3A3A3A", usage: "Text" },
    ],
    typography: { headline: "High-contrast serif (e.g. Didot)", body: "Refined sans (e.g. Neue Haas)", notes: "Generous leading; uppercase tracking for labels." },
  },
  {
    key: "telecom",
    name: "Telecom / Connectivity",
    industry: "Telecommunications",
    summary: "Bold, energetic, and human — connection that moves at the speed of life.",
    source: "archetype",
    sections: [
      S("essence", "Brand Essence", "Always on, always human — connecting people, things, and possibilities."),
      S("positioning", "Positioning", "The network that powers everyday life and tomorrow's innovation, with energy and reliability."),
      S("personality", "Personality & Values", "Energetic, friendly, dependable, optimistic."),
      S("voice", "Voice & Tone", "Upbeat and confident. Plain-spoken about value; warm and inclusive."),
      S("messaging", "Messaging Pillars", "Speed · Coverage · Value · Innovation."),
      S("logo", "Logo Usage", "Bold mark on a vivid field; keep clear space; mono on light/dark variants."),
      S("imagery", "Imagery & Art Direction", "People in motion, vivid gradients, dynamic crops; high energy and color."),
      S("applications", "Example Applications", "OOH, app, retail, sponsorship, packaging."),
    ],
    palette: [
      { name: "Electric Magenta", hex: "#E2007A", usage: "Primary" },
      { name: "Violet", hex: "#6D28D9", usage: "Accent" },
      { name: "Ink", hex: "#16121F", usage: "Text" },
      { name: "White", hex: "#FFFFFF", usage: "Background" },
    ],
    typography: { headline: "Bold grotesque (e.g. Archivo Bold)", body: "Inter", notes: "Big, punchy headlines; generous color blocking." },
  },
  {
    key: "healthcare",
    name: "Healthcare / Life Sciences",
    industry: "Health & Life Sciences",
    summary: "Calm, caring, and credible — clarity and trust for health.",
    source: "archetype",
    sections: [
      S("essence", "Brand Essence", "Care you can trust — science with a human heart."),
      S("positioning", "Positioning", "A partner in health that pairs clinical rigor with genuine compassion and clarity."),
      S("personality", "Personality & Values", "Caring, credible, reassuring, accessible."),
      S("voice", "Voice & Tone", "Warm, clear, and respectful. Plain language; empathetic; never alarmist."),
      S("messaging", "Messaging Pillars", "Trust · Care · Clarity · Outcomes."),
      S("logo", "Logo Usage", "Soft, approachable mark; protected space; mono for clinical contexts."),
      S("imagery", "Imagery & Art Direction", "Real patients and clinicians, soft natural light, calming blues and greens; inclusive and dignified."),
      S("applications", "Example Applications", "Patient apps, signage, brochures, clinician portals."),
    ],
    palette: [
      { name: "Trust Blue", hex: "#1D78C9", usage: "Primary" },
      { name: "Calm Teal", hex: "#16A394", usage: "Accent" },
      { name: "Slate", hex: "#37474F", usage: "Text" },
      { name: "Mist", hex: "#F1F6FA", usage: "Background" },
    ],
    typography: { headline: "Humanist sans (e.g. Source Sans Pro Semibold)", body: "Source Sans Pro", notes: "High legibility, large accessible sizes." },
  },
  {
    key: "bold-startup",
    name: "Bold Startup",
    industry: "Consumer / Startup",
    summary: "Playful, high-contrast, and expressive — a brand with attitude.",
    source: "archetype",
    sections: [
      S("essence", "Brand Essence", "Break the default — make people feel something."),
      S("positioning", "Positioning", "The challenger that rethinks a tired category with bold design and a human voice."),
      S("personality", "Personality & Values", "Bold, witty, irreverent, fast."),
      S("voice", "Voice & Tone", "Punchy and playful. Short, opinionated, human. Earn the joke; keep it kind."),
      S("messaging", "Messaging Pillars", "Different · Simple · Delightful · For you."),
      S("logo", "Logo Usage", "Distinctive wordmark; flexible color; embrace expressive layouts (within clear space)."),
      S("imagery", "Imagery & Art Direction", "High-contrast color blocking, big type, candid photography, expressive stickers/illustration."),
      S("applications", "Example Applications", "Social, app, merch, launch site."),
    ],
    palette: [
      { name: "Hot Coral", hex: "#FF5A3C", usage: "Primary" },
      { name: "Cobalt", hex: "#2547FF", usage: "Accent" },
      { name: "Black", hex: "#0A0A0A", usage: "Text" },
      { name: "Cream", hex: "#FFF7ED", usage: "Background" },
    ],
    typography: { headline: "Expressive display (e.g. Clash Display)", body: "Inter", notes: "Oversized headlines; high contrast." },
  },
];

export const BRAND_LIBRARY: BGGuideline[] = [HUMAIN_GUIDELINE, ...ARCHETYPES];
