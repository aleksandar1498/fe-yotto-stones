"use client";

import Head from "next/head";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGenerateSeoMetadata } from "@/lib/utils/seoHelper";

export const Seo = (props) => {
  const pathname = usePathname();

  const {
    seoTitle,
    seoDescription,
    seoKeywords,
    seoImage,
    canonical,
    locale,
    altLocale,
    structuredData,
  } = useGenerateSeoMetadata(props);

  // ✅ Force meta tag update on route change
  useEffect(() => {
    const existingCanonical = document.querySelector("link[rel='canonical']");
    if (existingCanonical) {
      existingCanonical.setAttribute("href", canonical);
    } else {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", canonical);
      document.head.appendChild(link);
    }

    // ✅ Update title manually
    document.title = seoTitle;

    // ✅ Clean up old meta tags to prevent duplicates
    const metaTags = document.head.querySelectorAll("[data-dynamic-meta]");
    metaTags.forEach((tag) => tag.remove());

    // ✅ Inject dynamic meta tags
    const createMeta = (name, content) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      meta.setAttribute("content", content);
      meta.setAttribute("data-dynamic-meta", "true");
      document.head.appendChild(meta);
    };

    createMeta("description", seoDescription);
    createMeta("keywords", seoKeywords);
    createMeta("robots", "index, follow");

    // ✅ Open Graph meta
    const createPropertyMeta = (property, content) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      meta.setAttribute("content", content);
      meta.setAttribute("data-dynamic-meta", "true");
      document.head.appendChild(meta);
    };

    createPropertyMeta("og:type", "website");
    createPropertyMeta("og:locale", locale);
    if (altLocale) createPropertyMeta("og:locale:alternate", altLocale);
    createPropertyMeta("og:site_name", "Yotto Stones");
    createPropertyMeta("og:title", seoTitle);
    createPropertyMeta("og:description", seoDescription);
    createPropertyMeta("og:url", canonical);
    createPropertyMeta("og:image", seoImage);

    // ✅ Twitter meta
    createMeta("twitter:card", "summary_large_image");
    createMeta("twitter:title", seoTitle);
    createMeta("twitter:description", seoDescription);
    createMeta("twitter:image", seoImage);

    // ✅ Inject structured data
    const existingJsonLd = document.querySelector("script[data-structured-data]");
    if (existingJsonLd) existingJsonLd.remove();

    if (structuredData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-structured-data", "true");
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [pathname, seoTitle, seoDescription, seoKeywords, seoImage, canonical, locale, altLocale, structuredData]);

  return <Head><title>{seoTitle}</title></Head>; // Initial fallback title
};

export default Seo;
