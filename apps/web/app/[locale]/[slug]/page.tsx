import { notFound } from "next/navigation";
import { getPage } from "../../../lib/cms";
import { RenderBlocks } from "@humain/ui";

export const revalidate = 60; // ISR

export default async function Page({ params }: { params: { locale: string; slug: string } }) {
  const locale = params.locale === "ar" ? "ar" : "en";
  const page = await getPage(params.slug, locale);
  if (!page) notFound();
  const dir = locale === "ar" ? "rtl" : "ltr";
  return (
    <main dir={dir} lang={locale}>
      <RenderBlocks blocks={page.blocks ?? []} />
    </main>
  );
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }) {
  const page = await getPage(params.slug, params.locale === "ar" ? "ar" : "en");
  return {
    title: page?.seo?.metaTitle ?? page?.title,
    description: page?.seo?.metaDescription,
    alternates: { canonical: page?.seo?.canonical },
    robots: page?.seo?.noindex ? "noindex" : "index,follow",
  };
}
