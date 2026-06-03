import type { MetadataRoute } from "next";
import { SOLIPRODE_BRAND_ASSETS } from "@/lib/brand-assets";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SoliProde",
    short_name: "SoliProde",
    description:
      "Prode Mundial Solidario 2026. Jugá el Mundial, competí con tu Team y ayudá a universitarios a terminar su carrera.",
    start_url: "/",
    display: "standalone",
    background_color: "#001a5c",
    theme_color: "#00327d",
    lang: "es-AR",
    icons: [
      {
        src: SOLIPRODE_BRAND_ASSETS.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: SOLIPRODE_BRAND_ASSETS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
