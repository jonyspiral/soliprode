import { buildOgCard, ogImageContentType, ogImageSize } from "@/lib/social/og-card";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function OpenGraphImage() {
  return buildOgCard({
    eyebrow: "SoliProde Teams",
    title: "Tu equipo, tu 11, tu ranking",
    description:
      "Construí tu Team, seguí a tus titulares y competí partido a partido dentro de SoliProde.",
  });
}
