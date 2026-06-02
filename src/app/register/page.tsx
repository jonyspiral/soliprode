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
        title="Entrá al torneo."
        description="Completá tus datos, confirmá tu cuenta y dejá lista tu inscripción para competir en SoliProde."
        tone="stadium"
      />
      <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard
          title="Registro"
          description="Primero armamos tu cuenta. Después elegís grupo, comunidad y empezás a seguir tus posiciones."
        >
          {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
          <RegisterForm />
        </SurfaceCard>

        <div className="grid gap-4">
          <SurfaceCard tone="primary" title="Paso a paso" description="La entrada al torneo está pensada para hacerse rápido desde el teléfono.">
            <div className="grid gap-3 text-sm leading-6 text-white/88">
              <div className="border border-white/20 bg-white/10 px-4 py-3">1. Creás tu cuenta con email y contraseña.</div>
              <div className="border border-white/20 bg-white/10 px-4 py-3">2. Confirmás tu correo para activar el acceso.</div>
              <div className="border border-white/20 bg-white/10 px-4 py-3">3. Entrás al panel y seguís tu inscripción.</div>
            </div>
          </SurfaceCard>

          <SurfaceCard tone="accent" title="Lo importante" description="El alta inicial se concentra en lo mínimo para no frenarte.">
            <p className="text-sm leading-6 text-[var(--color-ink)]">
              Grupo, comunidad y rankings sociales quedan para el siguiente paso. La prioridad
              ahora es entrar al torneo con tu alias y tu cuenta activa.
            </p>
          </SurfaceCard>
        </div>
      </section>
    </PageStack>
  );
}
