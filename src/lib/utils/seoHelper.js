import { usePathname } from "next/navigation";
import { useAutoBreadcrumbs } from "@/lib/utils/useAutoBreadcrumbs";
import { generateBreadcrumbStructuredData } from "@/lib/utils/seo";

const defaultSeo = {
  siteName: "Yotto Stones",
  defaultTitle: "Yotto Stones - Мрамор / Гранит и Варовик за вашия дом и бизнес",
  defaultDescription: "Открийте висококачествени естествени камъни - мрамор, гранит, варовик и още за интериорни и екстериорни проекти.",
  defaultKeywords: "мрамор, гранит, естествен камък, интериор, екстериор, плотове,первази, стъпала, облицовки, България, Yotto Stones",
  defaultImage: "https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b",
  siteUrl: "https://www.yottostones-bg.com",
  locale: "bg_BG",
};

export const useGenerateSeoMetadata = ({
  title,
  description,
  keywords,
  image,
  locale = defaultSeo.locale,
  altLocale,
  structuredData = {},
} = {}) => {
  const pathname = usePathname();
  const canonical = `${defaultSeo.siteUrl}${pathname !== "/" ? pathname : ""}`;

  const seoTitle = title ? `${title} | ${defaultSeo.siteName}` : defaultSeo.defaultTitle;
  const seoDescription = description || defaultSeo.defaultDescription;
  const seoKeywords = keywords || defaultSeo.defaultKeywords;
  const seoImage = image || defaultSeo.defaultImage;

  const breadcrumbs = useAutoBreadcrumbs();
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbs);

  const finalStructuredData = structuredData
    ? { ...structuredData, breadcrumb: breadcrumbStructuredData }
    : breadcrumbStructuredData;

  return {
    seoTitle,
    seoDescription,
    seoKeywords,
    seoImage,
    canonical,
    locale,
    altLocale,
    structuredData: finalStructuredData,
  };
};
