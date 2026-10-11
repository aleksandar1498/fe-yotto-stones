"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import Header5 from "@/components/pages/home/Header5";
import CompanyOfferings from "@/components/pages/home/CompanyOfferings";
import IntroSection from "@/components/pages/home/IntroSection";
import AboutUs from "@/components/pages/home/AboutUs";
import CTASection from "@/components/pages/home/Cta57";
import Materials from "@/components/common/Materials";
import MostValuedProducts from "@/components/common/MostValuedProducts";
import Contact14 from "@/components/common/Contact14";
import WorkSteps from "@/components/pages/home/WorkSteps";
import { useMaterialsLoader } from "@/hooks/useMaterialsLoader";

export default function HomePage() {
  const pathname = usePathname();

  useMaterialsLoader();

  useEffect(() => {
    const scrollToTarget = () => {
      const targetId = sessionStorage.getItem("scrollTarget");
      if (!targetId) return;

      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
          sessionStorage.removeItem("scrollTarget");
        }, 100);
      } else {
        setTimeout(() => {
          const retryElement = document.getElementById(targetId);
          if (retryElement) {
            retryElement.scrollIntoView({ behavior: "smooth" });
            sessionStorage.removeItem("scrollTarget");
          }
        }, 500);
      }
    };

    scrollToTarget();
  }, [pathname]);

  return (
    <>
      <Header5 />
      <IntroSection />
      <AboutUs />
      <CompanyOfferings />
      <MostValuedProducts />
      <WorkSteps />
      <CTASection />
      <Materials />
      <Contact14 />
    </>
  );
}