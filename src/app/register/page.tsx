import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
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
      <section className="mb-4 mt-2 text-center">
        <h1 className="font-serif text-[2.5rem] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-[var(--color-primary)]">
          Sumate a la
          <br />
          competencia
        </h1>
        <p className="mt-3 text-base leading-6 text-[var(--color-muted)]">
          La liga de pronósticos deportivos de SoliProde. Entrá rápido y dejá lista tu cuenta.
        </p>
      </section>

      <section className="relative mb-4 flex items-center justify-between px-4">
        <div className="absolute left-8 right-8 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--color-line)]" />
        <div className="absolute left-8 right-1/2 top-1/2 h-0.5 -translate-y-1/2 bg-[var(--color-primary)]" />
        {[
          { label: "Datos", active: true, done: true },
          { label: "Cuenta", active: true },
          { label: "Equipo", active: false },
        ].map((step, index) => (
          <div key={step.label} className="relative z-10 flex flex-col items-center">
            <div
              className={[
                "mb-1 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-semibold",
                step.active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[0_0_8px_rgba(0,50,125,0.4)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface-container-highest)] text-[var(--color-muted)]",
              ].join(" ")}
            >
              {step.done ? "✓" : index + 1}
            </div>
            <span className={`text-[12px] font-medium ${step.active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </section>

      <SurfaceCard
        title="Registro"
        description="Primero creás tu cuenta. Grupo y comunidad se definen después, ya dentro del torneo."
      >
        <div className="grid gap-4">
          {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
          <RegisterForm />
          <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border-2 border-[var(--color-line)] bg-[var(--color-surface-muted)]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-bg),transparent,var(--color-bg))]" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="mb-1 text-4xl text-[var(--color-primary)]">⚽</span>
              <p className="text-center font-serif text-[1.6rem] font-bold uppercase leading-none text-[var(--color-primary)]">
                Preparáte
                <br />
                para jugar
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
