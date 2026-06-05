// Real seed: creates an admin, a site, and a bilingual published page.
// Idempotent-ish: skips creation if the admin / site / page already exist.
import { getPayload } from "payload";
import config from "./payload.config";

const run = async () => {
  console.log("[seed] booting payload…");
  const payload = await getPayload({ config });
  console.log("[seed] payload ready, db connected");

  const email = "admin@humain.sa";
  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
  });

  if (existing.docs.length) {
    console.log("[seed] admin already exists:", email);
  } else {
    const admin = await payload.create({
      collection: "users",
      data: {
        email,
        password: process.env.SEED_ADMIN_PASSWORD || "ChangeMe_2026!",
        name: "Platform Admin",
        roles: ["admin"],
      },
    });
    console.log("[seed] created admin:", admin.email);
  }

  const siteRes = await payload.find({ collection: "sites", where: { domain: { equals: "humain.sa" } }, limit: 1 });
  const site = siteRes.docs[0] ?? (await payload.create({
    collection: "sites",
    data: { name: "HUMAIN", domain: "humain.sa", defaultLocale: "en" },
  }));

  // ---- Persona users (RBAC + ABAC) ----
  // Password is supplied via env (never hardcoded). Falls back to the admin
  // seed password, else a clearly-non-production dev value.
  const PERSONA_PW = process.env.PERSONA_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "ChangeMe_dev_only_2026";
  const personas = [
    { email: "viewer@humain.sa", name: "Vera Viewer", jobTitle: "Stakeholder", roles: ["viewer"], department: "executive" },
    { email: "author.en@humain.sa", name: "Adam Author", jobTitle: "Content Author", roles: ["author"], department: "marketing", sites: [site.id], locales: ["en"] },
    { email: "author.ar@humain.sa", name: "ليلى الكاتبة", jobTitle: "Arabic Author", roles: ["author"], department: "communications", sites: [site.id], locales: ["ar"] },
    { email: "reviewer@humain.sa", name: "Rana Reviewer", jobTitle: "Editor", roles: ["reviewer"], department: "editorial" },
    { email: "publisher@humain.sa", name: "Pavan Publisher", jobTitle: "Managing Editor", roles: ["publisher"], department: "editorial" },
    { email: "brand@humain.sa", name: "Bushra Brand", jobTitle: "Brand Lead", roles: ["brand"], department: "marketing" },
    { email: "hr@humain.sa", name: "Hana HR", jobTitle: "Talent Partner", roles: ["author"], department: "hr" },
    { email: "siteadmin@humain.sa", name: "Sam Admin", jobTitle: "Platform Admin", roles: ["admin"], department: "product" },
  ] as const;

  for (const p of personas) {
    const exists = await payload.find({ collection: "users", where: { email: { equals: p.email } }, limit: 1 });
    if (exists.docs.length) {
      console.log("[seed] persona exists:", p.email);
      continue;
    }
    await payload.create({
      collection: "users",
      data: { ...p, password: PERSONA_PW, active: true } as any,
    });
    console.log("[seed] created persona:", p.email, `(${p.roles.join("/")})`);
  }

  const pageRes = await payload.find({ collection: "pages", where: { slug: { equals: "home" } }, limit: 1 });
  let pageId: string | number;
  if (pageRes.docs.length) {
    pageId = pageRes.docs[0].id;
    console.log("[seed] home page already exists:", pageId);
  } else {
    const page = await payload.create({
      collection: "pages",
      locale: "en",
      data: {
        title: "Welcome to HUMAIN",
        slug: "home",
        site: site.id,
        _status: "published",
        blocks: [
          {
            blockType: "hero",
            heading: "Welcome to HUMAIN",
            subheading: "AI-native experiences, sovereign by design.",
            cta: { label: "Explore", href: "/products" },
            theme: "studio",
          },
        ],
      },
    });
    pageId = page.id;
    await payload.update({
      collection: "pages",
      id: pageId,
      locale: "ar",
      data: {
        title: "مرحبا بكم في هيومين",
        blocks: [
          {
            blockType: "hero",
            heading: "مرحبا بكم في هيومين",
            subheading: "تجارب مدعومة بالذكاء الاصطناعي، سيادية بحكم التصميم.",
            cta: { label: "استكشف", href: "/products" },
            theme: "studio",
          },
        ],
      },
    });
    console.log("[seed] created bilingual home page:", pageId);
  }

  // ---- Brand library (HUMAIN guideline + curated archetypes), idempotent ----
  try {
    const { BRAND_LIBRARY } = await import("./data/brand-archetypes.js");
    for (const g of BRAND_LIBRARY) {
      const exists = await payload.find({
        collection: "brandGuidelines",
        where: { and: [{ name: { equals: g.name } }, { isArchetype: { equals: true } }] },
        limit: 1,
      });
      if (exists.docs.length) { console.log("[seed] brand archetype exists:", g.name); continue; }
      await payload.create({
        collection: "brandGuidelines",
        data: {
          name: g.name,
          industry: g.industry,
          summary: g.summary,
          isArchetype: true,
          source: g.source,
          data: { sections: g.sections, palette: g.palette, typography: g.typography },
        } as any,
      });
      console.log("[seed] created brand archetype:", g.name);
    }
  } catch (e) {
    console.warn("[seed] brand library skipped:", (e as Error).message);
  }

  console.log("[seed] DONE. admin:", email, "| site:", site.id, "| page:", pageId);
  process.exit(0);
};

run().catch((err) => {
  console.error("[seed] FAILED:", err);
  process.exit(1);
});
