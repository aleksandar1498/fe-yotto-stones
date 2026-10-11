import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Видове обработка на ръбове за изделия от естествен камък",
  description:
    "Открийте различните видове обработка на ръбове за мрамор, гранит и други естествени камъни – фаска, закръгление, подленка. Персонализирайте визията с Yotto Stones.",
  keywords: [
    "обработка на ръбове",
    "мраморен ръб",
    "гранитен ръб",
    "фаска",
    "закръглен ръб",
    "подленка",
  ],
  alternates: { canonical: "/edges" },
  openGraph: { url: `${SITE_URL}/edges`, title: "Видове обработка на ръбове | Yotto Stones" },
};

const edgeServices = [
  ["Полиран кант с фаска 5мм", "Леко скосен и полиран ръб с фаска 5 мм за изискан вид."],
  ["Полиран кант с минимална фаска", "Много леко заобляне или фаска, запазваща естествения вид."],
  ["Едностранно закръгление ¼ R", "Меко закръглен ръб за елегантност и практичност."],
  ["Полирано чело с минимална фаска – подленка 20мм+20мм", "Гладко полиран ръб с леко заобляне."],
  ["Двустранно закръгление ½ R – подленка 20мм+20мм", "Гладки, заоблени ръбове от двете страни."],
  ["Едностранна фаска – подленка 20мм+20мм", "Ръб с изрязана фаска за остър и изчистен външен вид."],
  ["Едностранно закръгление ¼ R – подленка 20мм+20мм", "Едностранно заоблен ръб, който придава мекота на дизайна."],
];

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Обработка на ръбове за каменни плотове",
  url: `${SITE_URL}/edges`,
  provider: { "@id": `${SITE_URL}/#business` },
  areaServed: { "@type": "Country", name: "България" },
  description:
    "Yotto Stones предлага персонализирана обработка на ръбове за мрамор, гранит и други естествени камъни с внимание към детайла и безопасността.",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Каталог с видове обработка",
    itemListElement: edgeServices.map(([name, description]) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name, description },
    })),
  },
};

export default function EdgesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={[serviceJsonLd, breadcrumbJsonLd([{ name: "Обработки", path: "/edges" }])]} />
      {children}
    </>
  );
}
