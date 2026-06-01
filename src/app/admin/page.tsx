import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminPage() {
  return (
    <PlaceholderPage
      title="Admin"
      description="Base para el panel administrativo del torneo. No incluye lógica todavía, pero deja clara la ruta para operación futura."
      highlights={[
        "Crear módulos para partidos, usuarios, grupos y contenido.",
        "Preparar permisos y auditoría cuando exista autenticación real.",
        "Definir herramientas de soporte para resultados y rankings.",
      ]}
    />
  );
}
