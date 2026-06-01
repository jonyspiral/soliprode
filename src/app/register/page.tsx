import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { RegisterForm } from "@/components/auth/register-form";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <PageStack>
      <PageHero
        title="Creá tu cuenta de SoliProde."
        description="Primer flujo real de alta sobre Supabase Auth. Crea tu usuario, guarda tu perfil y deja tu participación en estado pendiente."
      />
      <SurfaceCard
        title="Registro"
        description="Comunidad y grupo quedan visibles en el formulario, pero su creación todavía no se ejecuta en esta etapa."
      >
        <RegisterForm />
      </SurfaceCard>
    </PageStack>
  );
}
