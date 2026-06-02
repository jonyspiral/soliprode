import type { Metadata } from "next";
import { Archivo_Narrow, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

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
    "Prode Mundial Solidario 2026. Jugá el Mundial, competí con tu grupo y ayudá a financiar una tesis.",
  applicationName: "SoliProde",
  keywords: [
    "SoliProde",
    "Prode Mundial Solidario 2026",
    "prode",
    "mundial",
    "quiniela",
    "pwa",
  ],
  manifest: "/manifest.webmanifest",
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
