import { notFound } from "next/navigation";
import { getPage } from "../../lib/cms";
import { RenderBlocks } from "@humain/ui";

export const revalidate = 60;

type Params = Promise<{ locale: string }>;

export default async function Home({ params }: { params: Params }) {
  const { locale: raw } = await params;
  const locale = raw === "ar" ? "ar" : "en";
  const page = await getPage("home", locale);
  if (!page) notFound();
  return (
    <main>
      <RenderBlocks blocks={page.blocks ?? []} />
    </main>
  );
}
