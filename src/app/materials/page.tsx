import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import MaterialsOverview from "@/components/pages/materials/MaterialsOverview";
import { SITE_URL, breadcrumbJsonLd, fetchMaterialGroups, truncate } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Материали – мрамор, гранит, варовик, оникс и травертин",
  description:
    "Разгледайте нашия каталог с естествени камъни – мрамор, гранит, варовик, оникс и травертин. Изберете перфектния материал за интериорни и екстериорни проекти с Yotto Stones.",
  keywords: ["естествен камък", "мрамор", "гранит", "варовик", "оникс", "травертин", "каталог"],
  alternates: { canonical: "/materials" },
  openGraph: { url: `${SITE_URL}/materials`, title: "Материали | Yotto Stones" },
};

export default async function MaterialsPage() {
  const groups = await fetchMaterialGroups();
  const catalog = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Каталог с естествени камъни",
    url: `${SITE_URL}/materials`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: groups.length,
      itemListElement: groups.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.name,
        description: truncate(g.description, 200) || undefined,
        url: `${SITE_URL}/materials/${g.id}`,
      })),
    },
  };

  return (
    <>
      <JsonLd data={[catalog, breadcrumbJsonLd([{ name: "Материали", path: "/materials" }])]} />
      <MaterialsOverview />
    </>
  );
}
