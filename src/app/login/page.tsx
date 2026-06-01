import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function LoginPage() {
  return (
    <PageStack>
      <PageHero
        title="Ingresá a tu cuenta."
        description="Pantalla base para autenticación futura. Por ahora solo define la superficie visual del acceso sin activar sesión real."
      />
      <SurfaceCard title="Estado del acceso" description="Placeholder de autenticación.">
        <div className="grid gap-4 md:grid-cols-3">
          <ActionTile
            title="Ingreso principal"
            description="Email o usuario para entrar al torneo y seguir el avance del Mundial."
            actionLabel="Acceder"
          />
          <ActionTile
            title="Recuperar acceso"
            description="Carril reservado para recuperación de contraseña o reenvío de acceso."
            actionLabel="Recuperar"
          />
          <ActionTile
            title="Nuevo participante"
            description="Acceso al registro para quienes se suman por primera vez a SoliProde."
            actionLabel="Crear cuenta"
          />
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
