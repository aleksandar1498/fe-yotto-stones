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
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    <html lang="bg">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />

        <meta name="theme-color" content="#D4AF37" />
        <meta name="robots" content="index, follow" />
        <meta
          name="keywords"
          content="мрамор, гранит, естествен камък, интериор, екстериор, плотове, стъпала, облицовки, България, Yotto Stones"
        />
        <link rel="canonical" href="https://www.yottostones-bg.com/" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="bg_BG" />
        <meta
          property="og:title"
          content="Yotto Stones – Вашият партньор в създаването на уникални изделия от естествен камък"
        />
        <meta
          property="og:description"
          content="Открийте нашите решения от мрамор, гранит и естествен камък за перфектни интериорни и екстериорни проекти."
        />
        <meta property="og:url" content="https://www.yottostones-bg.com/" />
        <meta
          property="og:image"
          content="https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b"
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content=" Yotto Stones – Вашият партньор в създаването на уникални изделия от естествен камък"
        />
        <meta
          name="twitter:description"
          content="Открийте нашите решения от мрамор, гранит и естествен камък за перфектни интериорни и екстериорни проекти."
        />
        <meta
          name="twitter:image"
          content="https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b"
        />

        {/* Favicons */}
        <link rel="icon" href="/assets/images/logo.svg" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/assets/images/logo.svg"
        />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Optional: Manifest + App Meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
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
