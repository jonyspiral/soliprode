import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://soliprode.vercel.app"),
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
      className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-ink)]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
