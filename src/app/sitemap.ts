import type { MetadataRoute } from "next";
import { SITE_URL, fetchMaterialGroups, materialImage } from "@/lib/seo/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/materials`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/edges`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const groups = await fetchMaterialGroups();
  const materialRoutes: MetadataRoute.Sitemap = groups.flatMap((g) => [
    { url: `${SITE_URL}/materials/${g.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 },
    ...g.materials.map((m) => ({
      url: `${SITE_URL}/materials/${g.id}/${m.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: [materialImage(m, g.id)],
    })),
  ]);

  return [...staticRoutes, ...materialRoutes];
}
