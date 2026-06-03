import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import {
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type RegisterPageProps = {
  searchParams?: Promise<{
    p?: string;
    promoter?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  let authErrorMessage: string | null = null;
  const params = searchParams ? await searchParams : undefined;
  const promoterCode = params ? readPromoterCodeFromSearchParams(new URLSearchParams(params)) : null;

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
      <section className="-mx-4 -mt-2 overflow-hidden rounded-b-[2rem] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] px-4 pb-8 pt-10 text-white md:-mx-6 md:rounded-[2rem] md:px-6 md:pb-10">
        <div className="mx-auto max-w-[18rem] text-center md:max-w-[36rem]">
          <h1 className="font-serif text-[2.35rem] font-bold uppercase leading-[0.94] tracking-[-0.03em] md:text-[4rem]">
            Creá tu cuenta y empezá a jugar
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#dfe6ff] md:mx-auto md:max-w-[26rem] md:text-[1.1rem] md:leading-7">
            Después cargás tus pronósticos y pagás para competir por premios.
          </p>
        </div>
      </section>

      <section className="relative mb-1 mt-2 flex items-center justify-between px-4 md:px-8">
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
                "mb-1 flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-semibold",
                step.active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]",
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
        title="Entrá al juego"
        description="Google va primero. Email queda como plan B para no perder el ritmo."
      >
        <div className="grid gap-4">
          {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
          <RegisterForm promoterCode={promoterCode} />
          <div className="relative overflow-hidden rounded-lg border border-[var(--color-line)] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] p-5 text-white">
            <div className="absolute inset-0 opacity-14 [background-image:linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.12)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.12)_75%,rgba(255,255,255,0.12)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.12)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.12)_75%,rgba(255,255,255,0.12)_76%,transparent_77%,transparent)] [background-size:22px_22px]" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
                  Próximo paso
                </p>
                <p className="mt-2 font-serif text-[1.7rem] font-bold uppercase leading-none">
                  Armás tu grupo
                  <br />
                  y salís a competir
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
