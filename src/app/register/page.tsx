import { PageHero } from "@/components/page-hero";
import { ActionTile, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

const registerSteps = [
  {
    title: "Crear perfil",
    description: "Alta inicial para entrar al prode, guardar pronósticos y participar en rankings.",
    actionLabel: "Nombre, email y clave",
  },
  {
    title: "Elegir grupo",
    description: "Podrás unirte a un grupo existente o seguir con perfil individual antes de competir.",
    actionLabel: "Grupo opcional",
  },
  {
    title: "Entrar a competir",
    description: "Acceso directo al dashboard con el próximo partido listo para pronosticar.",
    actionLabel: "Ir al panel",
  },
];

export default function RegisterPage() {
  return (
    <PageStack>
      <PageHero
        title="Creá tu cuenta de SoliProde."
        description="Pantalla base para el registro futuro. Mantiene la jerarquía visual y el recorrido esperado sin activar todavía autenticación real."
      />
      <SurfaceCard title="Flujo esperado" description="Placeholder de onboarding inicial.">
        <div className="grid gap-4 md:grid-cols-3">
          {registerSteps.map((step) => (
            <ActionTile
              key={step.title}
              title={step.title}
              description={step.description}
              actionLabel={step.actionLabel}
            />
          ))}
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
