import { buildOgCard, ogImageContentType, ogImageSize } from "@/lib/social/og-card";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function OpenGraphImage() {
  return buildOgCard({
    eyebrow: "SoliProde Groups",
    title: "Armá tu Team",
    description:
      "Sumate a un Group, elegí tu 11 titular y peleá el ranking competitivo dentro de la app.",
  });
}
