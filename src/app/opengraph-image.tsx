import { buildOgCard, ogImageContentType, ogImageSize } from "@/lib/social/og-card";

export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function OpenGraphImage() {
  return buildOgCard({
    eyebrow: "Prode mundial solidario",
    title: "Jugá el mundial y ayudá",
    description:
      "Competí con tu Team, cargá tus pronósticos y ayudá a universitarios a terminar su carrera.",
  });
}
