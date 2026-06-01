import { PlaceholderPage } from "@/components/placeholder-page";

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Dashboard"
      description="Panel principal para resumir el torneo, el rendimiento del usuario y accesos rápidos a partidos, grupos y rankings."
      highlights={[
        "Diseñar tarjetas de estado del usuario y actividad reciente.",
        "Incorporar próximos partidos y resultados destacados.",
        "Preparar widgets para ranking individual y de comunidades.",
      ]}
    />
  );
}
