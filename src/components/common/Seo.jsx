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

  useEffect(() => {
    // ✅ Canonical URL
    const existingCanonical = document.querySelector("link[rel='canonical']");
    if (existingCanonical) {
      existingCanonical.setAttribute("href", canonical);
    } else {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", canonical);
      document.head.appendChild(link);
    }

    // ✅ Title
    document.title = seoTitle;

    // ✅ Cleanup
    const metaTags = document.head.querySelectorAll("[data-dynamic-meta]");
    metaTags.forEach((tag) => tag.remove());

    // ✅ Utility functions
    const createMeta = (name, content) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("name", name);
      meta.setAttribute("content", content);
      meta.setAttribute("data-dynamic-meta", "true");
      document.head.appendChild(meta);
    };

    const createPropertyMeta = (property, content) => {
      if (!content) return;
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      meta.setAttribute("content", content);
      meta.setAttribute("data-dynamic-meta", "true");
      document.head.appendChild(meta);
    };

    // ✅ Meta tags
    createMeta("description", seoDescription);
    createMeta("keywords", seoKeywords);
    createMeta("robots", "index, follow");

    // ✅ Open Graph
    createPropertyMeta("og:type", "website");
    createPropertyMeta("og:locale", locale);
    if (altLocale) createPropertyMeta("og:locale:alternate", altLocale);
    createPropertyMeta("og:site_name", "Yotto Stones");
    createPropertyMeta("og:title", seoTitle);
    createPropertyMeta("og:description", seoDescription);
    createPropertyMeta("og:url", canonical);
    createPropertyMeta("og:image", seoImage);

    // ✅ Twitter
    createMeta("twitter:card", "summary_large_image");
    createMeta("twitter:title", seoTitle);
    createMeta("twitter:description", seoDescription);
    createMeta("twitter:image", seoImage);
    createPropertyMeta("twitter:image", seoImage); // 🆕 added as property (important)

    // ✅ Structured data
    const existingJsonLd = document.querySelector("script[data-structured-data]");
    if (existingJsonLd) existingJsonLd.remove();

    if (structuredData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-structured-data", "true");
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    // ✅ Favicon injection – 🆕
    const faviconHref = "/favicon.ico";
    const existingFavicon = document.querySelector("link[rel='icon']");
    if (!existingFavicon) {
      const link = document.createElement("link");
      link.setAttribute("rel", "icon");
      link.setAttribute("href", faviconHref);
      link.setAttribute("data-dynamic-meta", "true");
      document.head.appendChild(link);
    }

    // ✅ Apple touch icon – 🆕
    const appleIcon = document.createElement("link");
    appleIcon.setAttribute("rel", "apple-touch-icon");
    appleIcon.setAttribute("href", "/apple-touch-icon.png");
    appleIcon.setAttribute("data-dynamic-meta", "true");
    document.head.appendChild(appleIcon);

    // ✅ Preload favicon – 🆕
    const preload = document.createElement("link");
    preload.setAttribute("rel", "preload");
    preload.setAttribute("href", faviconHref);
    preload.setAttribute("as", "image");
    preload.setAttribute("data-dynamic-meta", "true");
    document.head.appendChild(preload);

  }, [
    pathname,
    seoTitle,
    seoDescription,
    seoKeywords,
    seoImage,
    canonical,
    locale,
    altLocale,
    structuredData,
  ]);

  return (
    <Head>
      <title>{seoTitle}</title>
    </Head>
  );
};

export default Seo;
