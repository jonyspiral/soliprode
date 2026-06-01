import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SoliProde",
    short_name: "SoliProde",
    description:
      "Prode Mundial Solidario 2026. Jugá el Mundial, competí con tu grupo y ayudá a financiar una tesis.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7fb",
    theme_color: "#0f766e",
    lang: "es-AR",
  };
}
