"use client";

import Contact14 from "@/components/common/Contact14";
import PageHeader from "@/components/common/PageHeader";
import React from "react";

const Contacts = () => {
  return (
    <>
      <PageHeader
        title="Свържи се"
        subtitle={"Получи твоята персонализирана оферта"}
      />
      <Contact14 includeHeading={false} />
    </>
  );
};

export default Contacts;
