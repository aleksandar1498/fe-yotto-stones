import type { Metadata } from "next";
import type { ReactNode } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Свържете се с Yotto Stones за оферти и консултации за изделия от мрамор, гранит и естествен камък. София, ул. \"Владимир Зограф\" 121, тел. +359 895 198 805.",
  alternates: { canonical: "/contact" },
  openGraph: { url: `${SITE_URL}/contact`, title: "Контакти | Yotto Stones" },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Контакти - Yotto Stones",
  url: `${SITE_URL}/contact`,
  description: "Свържете се с Yotto Stones за персонализирани решения с естествен камък.",
  about: { "@id": `${SITE_URL}/#business` },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={[contactJsonLd, breadcrumbJsonLd([{ name: "Контакти", path: "/contact" }])]} />
      {children}
    </>
  );
}
