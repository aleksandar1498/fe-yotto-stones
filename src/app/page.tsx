"use client";

import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMaterials } from "@/redux/materialSlice";
import Header5 from "@/components/pages/home/Header5";
import CompanyOfferings from "@/components/pages/home/CompanyOfferings";
import IntroSection from "@/components/pages/home/IntroSection";
import AboutUs from "@/components/pages/home/AboutUs";
import CTASection from "@/components/pages/home/Cta57";
import Materials from "@/components/pages/home/Materials";
import FeatureSection from "@/components/pages/home/FeatureSection";
import Contact14 from "@/components/common/Contact14";
import WorkSteps from "@/components/pages/home/WorkSteps";
import { usePathname } from "next/navigation";

export default function Home() {
  const dispatch = useDispatch();

  useEffect(() => {
    const materialsRef = ref(db, "group_materials");

    const unsubscribe = onValue(materialsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const materialsArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        console.log(materialsArray);
        dispatch(setMaterials(materialsArray));
      }
    });

    return () => unsubscribe(); // Cleanup
  }, [dispatch]);

  const pathname = usePathname();

  useEffect(() => {
      const scrollTarget = sessionStorage.getItem('scrollTarget');
      if (scrollTarget) {
          const element = document.getElementById(scrollTarget);
          if (element) {
              setTimeout(() => {
                  element.scrollIntoView({ behavior: 'smooth' });
                  sessionStorage.removeItem('scrollTarget');
              }, 100); // Timeout ensures DOM is ready
          } else {
              // Retry scrolling after a short delay if not found immediately
              setTimeout(() => {
                  const retryElement = document.getElementById(scrollTarget);
                  if (retryElement) {
                      retryElement.scrollIntoView({ behavior: 'smooth' });
                      sessionStorage.removeItem('scrollTarget');
                  }
              }, 500);
          }
      }
  }, [pathname]); // Triggers on route change

  return (
    <>
      <Header5 />
      <IntroSection />
      <AboutUs />
      {/* <FeatureSection /> */}
      {/* <Layout3 /> */}
      <CompanyOfferings />
      {/* <Portfolio6 /> */}
      <WorkSteps />
      <CTASection />
      <Materials />

      {/* <Layout83 />  */}
      <Contact14 />
    </>
  );
}
