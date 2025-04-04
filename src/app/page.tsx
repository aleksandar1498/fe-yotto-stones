"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { usePathname } from "next/navigation";
import { ref, onValue, Unsubscribe } from "firebase/database";

import { db } from "@/lib/firebase";
import { setMaterials } from "@/redux/materialSlice";

import Header5 from "@/components/pages/home/Header5";
import CompanyOfferings from "@/components/pages/home/CompanyOfferings";
import IntroSection from "@/components/pages/home/IntroSection";
import AboutUs from "@/components/pages/home/AboutUs";
import CTASection from "@/components/pages/home/Cta57";
import Materials from "@/components/common/Materials";
import Contact14 from "@/components/common/Contact14";
import WorkSteps from "@/components/pages/home/WorkSteps";

export default function Home() {
  const dispatch = useDispatch();
  const pathname = usePathname();

  useEffect(() => {
    const materialsRef = ref(db, "group_materials");

    const unsubscribe: Unsubscribe = onValue(materialsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const materialsArray = data;

      dispatch(setMaterials(materialsArray));
    });

    return () => unsubscribe(); // Cleanup
  }, [dispatch]);

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
      <WorkSteps />
      <CTASection />
      <Materials />
      <Contact14 />
    </>
  );
}
