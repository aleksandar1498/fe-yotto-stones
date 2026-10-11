import { materialImageSrc, materialDisplayName } from "@/lib/materialImage";

export const SITE_URL = "https://www.yottostones-bg.com";
export const SITE_NAME = "Yotto Stones";
export const DEFAULT_TITLE = "Yotto Stones - Мрамор и Гранит за вашия дом и бизнес";
export const DEFAULT_DESCRIPTION =
  "Открийте висококачествени естествени камъни - мрамор, гранит, варовик, оникс и травертин за интериорни и екстериорни проекти. Изработка по размер в София.";
export const DEFAULT_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b";

const RTDB_URL = "https://yotto-stones-default-rtdb.europe-west1.firebasedatabase.app";

export type SeoMaterial = {
  id: number | string;
  name?: string;
  displayName?: string;
  description?: string;
  seoDescription?: string;
  imageUrl?: string;
  imageName?: string;
  origin?: string;
  surface?: string;
  [key: string]: unknown;
};

export type SeoGroup = {
  id: number | string;
  name?: string;
  title?: string;
  description?: string;
  materials: SeoMaterial[];
};

// Public catalogue (readable without auth). Cached and revalidated hourly.
export async function fetchMaterialGroups(): Promise<SeoGroup[]> {
  try {
    const res = await fetch(`${RTDB_URL}/group_materials.json`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data) return [];
    return (Object.values(data) as SeoGroup[])
      .filter(Boolean)
      .map((g) => ({ ...g, materials: Object.values(g.materials || {}).filter(Boolean) as SeoMaterial[] }));
  } catch {
    return [];
  }
}

export async function findGroup(groupId: string) {
  const groups = await fetchMaterialGroups();
  return groups.find((g) => String(g.id) === groupId) ?? null;
}

export function absoluteUrl(src: string) {
  if (!src) return DEFAULT_IMAGE;
  return src.startsWith("http") ? src : `${SITE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

export function materialName(material: SeoMaterial) {
  return material.displayName || materialDisplayName(material);
}

export function materialImage(material: SeoMaterial, groupId: string | number) {
  return absoluteUrl(materialImageSrc(material, groupId));
}

export function truncate(text: string | undefined, max = 160) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#business`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  image: DEFAULT_IMAGE,
  description: DEFAULT_DESCRIPTION,
  email: "yottostones@gmail.com",
  telephone: ["+359895198805", "+359885053680"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. \"Владимир Зограф\" 121",
    postalCode: "1229",
    addressLocality: "София",
    addressCountry: "BG",
  },
  areaServed: "BG",
};

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Начало", path: "/" }, ...items].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}
