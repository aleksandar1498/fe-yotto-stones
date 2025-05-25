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
import Seo from "@/components/common/Seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Yotto Stones - Мрамор и Гранит за вашия дом и бизнес",
  description: "Открийте висококачествени естествени камъни за интериорни и екстериорни проекти.",
  metadataBase: new URL("https://www.yottostones-bg.com"),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  other: {
    "mask-icon": "/safari-pinned-tab.svg",
    "theme-color": "#D4AF37",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
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
        {/* <Seo /> */}
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
