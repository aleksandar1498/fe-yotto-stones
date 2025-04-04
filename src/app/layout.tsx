"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./globals.css";
import Navbar from "@/components/common/Navbar9";
import Footer1 from "@/components/common/Footer1";
import CallButton from "@/components/common/CallButton";
import CookieBanner from "@/components/common/CookieBanner";
import ReduxProvider from "@/providers/ReduxProvider";
import PersistProvider from "@/providers/PersistProvider";
import CookieSettingsProvider from "@/providers/CookieSettingsProvider";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty("--app-height", `${window.innerHeight}px`);
    };

    setAppHeight();
    window.addEventListener("resize", setAppHeight);

    return () => window.removeEventListener("resize", setAppHeight);
  }, []);

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        {/* <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        /> */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ height: "var(--app-height)" }}
      >
        <ReduxProvider>
          <PersistProvider>
            <CookieSettingsProvider>
              <Navbar />
              {children}
              <Footer1 />
              <CallButton />
              <CookieBanner />
            </CookieSettingsProvider>
          </PersistProvider>
        </ReduxProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
