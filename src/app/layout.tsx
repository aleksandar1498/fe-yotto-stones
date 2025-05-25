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
  description:
    "Открийте висококачествени естествени камъни за интериорни и екстериорни проекти.",
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
  openGraph: {
    type: "website",
    url: "https://www.yottostones-bg.com",
    title: "Yotto Stones - Мрамор и Гранит за вашия дом и бизнес",
    description:
      "Открийте висококачествени естествени камъни за интериорни и екстериорни проекти.",
    siteName: "Yotto Stones",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b", // Make sure this exists
        width: 1200,
        height: 630,
        alt: "Yotto Stones Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yotto Stones - Мрамор и Гранит",
    description:
      "Открийте най-добрите каменни решения за вашия дом или бизнес.",
    images: ["https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b"],
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* ✅ Removed duplicate favicon and theme-color meta tags */}
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
