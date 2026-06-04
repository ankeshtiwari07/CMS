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

  console.log("[seed] DONE. admin:", email, "| site:", site.id, "| page:", pageId);
  process.exit(0);
};

run().catch((err) => {
  console.error("[seed] FAILED:", err);
  process.exit(1);
});
