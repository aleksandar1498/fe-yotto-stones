import type { Metadata, Viewport } from "next";
import { Exo_2 } from "next/font/google";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./globals.css";
import Navbar from "@/components/common/Navbar9";
import Footer1 from "@/components/common/Footer1";
import CookieBanner from "@/components/common/CookieBanner";
import SiteChrome from "@/components/common/SiteChrome";
import ReduxProvider from "@/providers/ReduxProvider";
import PersistProvider from "@/providers/PersistProvider";
import CookieSettingsProvider from "@/providers/CookieSettingsProvider";
import JsonLd from "@/components/seo/JsonLd";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  organizationJsonLd,
} from "@/lib/seo/site";

// Self-hosted by next/font: no render-blocking request to Google Fonts.
const exo2 = Exo_2({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-exo2",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#D4AF37",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#D4AF37" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" className={exo2.variable}>
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://yotto-stones-default-rtdb.europe-west1.firebasedatabase.app" />
      </head>
      <body className="antialiased" style={{ height: "var(--app-height)" }}>
        <JsonLd data={organizationJsonLd} />
        <ReduxProvider>
          <PersistProvider>
            <CookieSettingsProvider>
              <SiteChrome
                header={<Navbar />}
                footer={
                  <>
                    <Footer1 />
                    <CookieBanner />
                  </>
                }
              >
                {children}
              </SiteChrome>
            </CookieSettingsProvider>
          </PersistProvider>
        </ReduxProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}