import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import MaterialGroupClient from "@/components/pages/materials/MaterialGroupClient";
import {
  SITE_URL,
  breadcrumbJsonLd,
  fetchMaterialGroups,
  findGroup,
  materialImage,
  materialName,
  truncate,
} from "@/lib/seo/site";

type Params = Promise<{ material_group_id: string }>;

export const revalidate = 3600;

export async function generateStaticParams() {
  const groups = await fetchMaterialGroups();
  return groups.map((g) => ({ material_group_id: String(g.id) }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { material_group_id } = await params;
  const group = await findGroup(material_group_id);
  if (!group) return { title: "Материали", robots: { index: false } };

  const title = `${group.name}${group.title ? ` – ${group.title}` : ""}`;
  const description =
    truncate(group.description, 160) ||
    `${group.name} от Yotto Stones – плотове, стъпала, первази и облицовки по размер.`;
  const cover = group.materials[0] ? materialImage(group.materials[0], group.id) : undefined;
  const url = `${SITE_URL}/materials/${group.id}`;

  return {
    title,
    description,
    alternates: { canonical: `/materials/${group.id}` },
    openGraph: { url, title: `${title} | Yotto Stones`, description, images: cover ? [{ url: cover }] : undefined },
    twitter: { title: `${title} | Yotto Stones`, description, images: cover ? [cover] : undefined },
  };
}

export default async function MaterialGroupPage({ params }: { params: Params }) {
  const { material_group_id } = await params;
  const groups = await fetchMaterialGroups();
  const group = groups.find((g) => String(g.id) === material_group_id);
  // No notFound(): the catalogue is cached for an hour; the client loads live data.

  const jsonLd = group
    ? [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: group.name,
          description: truncate(group.description, 300) || undefined,
          url: `${SITE_URL}/materials/${group.id}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: group.materials.length,
            itemListElement: group.materials.map((m, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: materialName(m),
              url: `${SITE_URL}/materials/${group.id}/${m.id}`,
              image: materialImage(m, group.id),
            })),
          },
        },
        breadcrumbJsonLd([
          { name: "Материали", path: "/materials" },
          { name: group.name || "", path: `/materials/${group.id}` },
        ]),
      ]
    : null;

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <MaterialGroupClient />
    </>
  );
}
