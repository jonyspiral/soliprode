import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { PageHero } from "@/components/page-hero";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
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
      "No pudimos revisar tu sesión en este momento. Si el alta no responde, reintentá en unos minutos.";
  }

  return (
    <PageStack>
      <PageHero
        title="Creá tu cuenta."
        description="Registrate para entrar al Prode Mundial Solidario 2026 con tu alias, seguir tus posiciones y sumarte al torneo."
      />
      <SurfaceCard
        title="Registro"
        description="Completá tus datos básicos ahora. El grupo y la comunidad los vas a elegir después de entrar."
      >
        {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
        <RegisterForm />
      </SurfaceCard>
    </PageStack>
  );
}
