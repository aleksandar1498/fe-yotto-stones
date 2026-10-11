import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import MaterialDetailClient from "@/components/pages/materials/MaterialDetailClient";
import {
  SITE_URL,
  breadcrumbJsonLd,
  fetchMaterialGroups,
  findGroup,
  materialImage,
  materialName,
  truncate,
  type SeoMaterial,
} from "@/lib/seo/site";

type Params = Promise<{ material_group_id: string; material_id: string }>;

export const revalidate = 3600;

export async function generateStaticParams() {
  const groups = await fetchMaterialGroups();
  return groups.flatMap((g) =>
    g.materials.map((m) => ({ material_group_id: String(g.id), material_id: String(m.id) })),
  );
}

async function lookup(groupId: string, materialId: string) {
  const group = await findGroup(groupId);
  const material = group?.materials.find((m) => String(m.id) === materialId) ?? null;
  return { group, material };
}

function describe(material: SeoMaterial, groupName?: string) {
  return (
    truncate(material.seoDescription, 160) ||
    truncate(material.description, 160) ||
    `${materialName(material)}${groupName ? ` – ${groupName.toLowerCase()}` : ""} от Yotto Stones. Изработка на плотове, стъпала, первази и облицовки по размер.`
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { material_group_id, material_id } = await params;
  const { group, material } = await lookup(material_group_id, material_id);
  if (!group || !material) return { title: "Материал", robots: { index: false } };

  const name = materialName(material);
  const title = group.name ? `${name} – ${group.name}` : name;
  const description = describe(material, group.name);
  const image = materialImage(material, group.id);
  const path = `/materials/${group.id}/${material.id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      url: `${SITE_URL}${path}`,
      title: `${title} | Yotto Stones`,
      description,
      images: [{ url: image, alt: name }],
    },
    twitter: { title: `${title} | Yotto Stones`, description, images: [image] },
  };
}

export default async function MaterialDetailPage({ params }: { params: Params }) {
  const { material_group_id, material_id } = await params;
  const groups = await fetchMaterialGroups();
  const group = groups.find((g) => String(g.id) === material_group_id);
  const material = group?.materials.find((m) => String(m.id) === material_id);
  // No notFound(): the catalogue is cached for an hour, so a freshly added material
  // must still render (the client loads live data). Unknown ids get noindex via metadata.

  const jsonLd =
    group && material
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: materialName(material),
            description: describe(material, group.name),
            image: [materialImage(material, group.id)],
            url: `${SITE_URL}/materials/${group.id}/${material.id}`,
            category: group.name,
            material: group.name,
            brand: { "@type": "Brand", name: "Yotto Stones" },
            ...(material.origin ? { countryOfOrigin: material.origin } : {}),
          },
          breadcrumbJsonLd([
            { name: "Материали", path: "/materials" },
            { name: group.name || "", path: `/materials/${group.id}` },
            { name: materialName(material), path: `/materials/${group.id}/${material.id}` },
          ]),
        ]
      : null;

  return (
    <>
      {jsonLd && <JsonLd data={jsonLd} />}
      <MaterialDetailClient />
    </>
  );
}
