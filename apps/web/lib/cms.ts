const BASE = process.env.CMS_BASE_URL || "http://localhost:3001";

export async function getPage(slug: string, locale: string) {
  const res = await fetch(
    `${BASE}/api/pages?where[slug][equals]=${slug}&where[_status][equals]=published&locale=${locale}&depth=2`,
    { next: { revalidate: 60, tags: [`page:${slug}`] } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.docs?.[0] ?? null;
}

export async function getSettings(locale: string) {
  try {
    const res = await fetch(`${BASE}/api/globals/settings?locale=${locale}&depth=1`, {
      next: { revalidate: 300, tags: ["settings"] },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
