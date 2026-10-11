import type { Metadata } from "next";
import HomePage from "@/components/pages/home/HomePage";
import JsonLd from "@/components/seo/JsonLd";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  keywords: [
    "мрамор",
    "гранит",
    "варовик",
    "оникс",
    "травертин",
    "естествен камък",
    "плотове",
    "стъпала",
    "первази",
    "облицовки",
    "София",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "bg-BG",
  description: DEFAULT_DESCRIPTION,
  publisher: { "@id": `${SITE_URL}/#business` },
};

export default function Page() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <HomePage />
    </>
  );
}