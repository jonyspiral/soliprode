import type { Metadata } from "next";
import { Archivo_Narrow, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { SOLIPRODE_BRAND_ASSETS } from "@/lib/brand-assets";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.soliprode.com"),
  title: {
    default: "SoliProde",
    template: "%s | SoliProde",
  },
  description:
    "Prode Mundial Solidario 2026. Jugá el Mundial, competí con tu Team y ayudá a universitarios a terminar su carrera.",
  applicationName: "SoliProde",
  keywords: [
    "SoliProde",
    "Prode Mundial Solidario 2026",
    "prode",
    "mundial",
    "quiniela",
    "pwa",
  ],
  openGraph: {
    type: "website",
    url: "https://www.soliprode.com",
    siteName: "SoliProde",
    title: "SoliProde",
    description:
      "Prode Mundial Solidario 2026. Jugá el Mundial, competí con tu Team y ayudá a universitarios a terminar su carrera.",
    images: [
      {
        url: SOLIPRODE_BRAND_ASSETS.icon512,
        width: 512,
        height: 512,
        alt: "SoliProde",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "SoliProde",
    description:
      "Prode Mundial Solidario 2026. Jugá el Mundial, competí con tu Team y ayudá a universitarios a terminar su carrera.",
    images: [SOLIPRODE_BRAND_ASSETS.icon512],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: SOLIPRODE_BRAND_ASSETS.favicon, sizes: "any" },
      { url: SOLIPRODE_BRAND_ASSETS.icon192, sizes: "192x192", type: "image/png" },
      { url: SOLIPRODE_BRAND_ASSETS.icon512, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: SOLIPRODE_BRAND_ASSETS.appleTouchIcon, sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SoliProde",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${archivoNarrow.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-ink)]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
