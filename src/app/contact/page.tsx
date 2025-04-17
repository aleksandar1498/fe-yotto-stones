"use client";

import Contact14 from "@/components/common/Contact14";
import PageHeader from "@/components/common/PageHeader";
import Seo from "@/components/common/Seo";
import React from "react";

const Contacts = () => {
  return (
    <>
      <Seo
        title="Контакти"
        description="Свържете се с нас за оферти и консултации относно нашите изделия от естествен камък."
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Контакти - Yotto Stones",
          url: "https://www.yottostones-bg.com/contact",
          description:
            "Свържете се с Yotto Stones за персонализирани решения с естествен камък.",
        }}
      />
      <PageHeader
        title="Свържи се"
        subtitle={"Получи твоята персонализирана оферта"}
      />
      <Contact14 includeHeading={false} />
    </>
  );
};

export default Contacts;
