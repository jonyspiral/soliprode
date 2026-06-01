import { PlaceholderPage } from "@/components/placeholder-page";

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="Login"
      description="Pantalla base para autenticación futura. Queda preparada para incorporar acceso con Supabase u otro proveedor sin rediseñar la shell."
      highlights={[
        "Definir flujo de ingreso y recuperación de acceso.",
        "Conectar proveedores de autenticación cuando se habilite Supabase.",
        "Agregar validaciones y estados de sesión persistentes.",
      ]}
    />
  );
}
