import { notFound } from "next/navigation";
import { getPage } from "../../../lib/cms";
import { RenderBlocks } from "@humain/blocks-render";

export const dynamic = "force-dynamic"; // SSR (avoids build-time CMS dependency)

type Params = Promise<{ locale: string; slug: string }>;

export default async function Page({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  const locale = raw === "ar" ? "ar" : "en";
  const page = await getPage(slug, locale);
  if (!page) notFound();
  return (
    <main>
      <RenderBlocks blocks={page.blocks ?? []} />
    </main>
  );
}

export async function generateMetadata({ params }: { params: Params }) {
  const { locale: raw, slug } = await params;
  const page = await getPage(slug, raw === "ar" ? "ar" : "en");
  return {
    title: page?.seo?.metaTitle ?? page?.title,
    description: page?.seo?.metaDescription,
    alternates: { canonical: page?.seo?.canonical },
    robots: page?.seo?.noindex ? "noindex" : "index,follow",
  };
}
