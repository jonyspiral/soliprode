import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { InfoNotice } from "@/components/placeholder-primitives";
import { RegisterForm } from "@/components/auth/register-form";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

export default async function RegisterPage() {
  let authErrorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    if (user) {
      redirect("/dashboard");
    }
  } catch {
    authErrorMessage =
      "No pudimos validar la conexión con Supabase en este momento. El formulario sigue disponible, pero si el problema persiste no se va a completar el alta.";
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
        {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
        <RegisterForm />
      </SurfaceCard>
    </PageStack>
  );
}
