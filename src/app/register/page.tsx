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
      <section className="-mx-4 -mt-2 overflow-hidden rounded-b-[2rem] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] px-4 pb-8 pt-8 text-white shadow-[0_18px_42px_rgba(0,50,125,0.28)]">
        <div className="mx-auto max-w-[21rem] text-center">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
            Alta de jugador
          </div>
          <h1 className="mt-5 font-serif text-[2.5rem] font-bold uppercase leading-[0.94] tracking-[-0.03em]">
            Creá tu cuenta y entrá al torneo
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#dfe6ff]">
            Empezás con tus datos, confirmás tu correo y después elegís dónde competir.
          </p>
        </div>
      </section>

      <section className="relative mb-2 mt-1 flex items-center justify-between px-4">
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
          <div className="relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[linear-gradient(135deg,#00327d_0%,#0047ab_62%,#0c6780_100%)] p-5 text-white">
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.16)_25%,rgba(255,255,255,0.16)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.16)_75%,rgba(255,255,255,0.16)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.16)_25%,rgba(255,255,255,0.16)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.16)_75%,rgba(255,255,255,0.16)_76%,transparent_77%,transparent)] [background-size:22px_22px]" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
                  Próximo paso
                </p>
                <p className="mt-2 font-serif text-[1.7rem] font-bold uppercase leading-none">
                  Elegís grupo
                  <br />
                  y comunidad
                </p>
              </div>
              <span className="text-5xl">⚽</span>
            </div>
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
