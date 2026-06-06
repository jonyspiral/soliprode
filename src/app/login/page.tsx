import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { SOLIPRODE_BRAND_ASSETS } from "@/lib/brand-assets";
import { readPromoterCodeFromSearchParams } from "@/lib/auth/promoter-attribution";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    p?: string;
    promoter?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  let authErrorMessage: string | null = null;
  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next?.startsWith("/") ? params.next : "/dashboard";
  const promoterCode = params ? readPromoterCodeFromSearchParams(new URLSearchParams(params)) : null;
  const authErrorCode = typeof params?.error === "string" ? params.error : null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    if (user) {
      redirect(nextPath);
    }
  } catch {
    authErrorMessage = "No pudimos revisar tu sesión ahora. Igual podés intentar ingresar.";
  }

  if (!authErrorMessage && authErrorCode) {
    authErrorMessage =
      authErrorCode === "oauth_failed" || authErrorCode === "confirm_failed"
        ? "No pudimos iniciar sesión con Google. Intentá nuevamente."
        : authErrorCode === "bootstrap_failed"
          ? "Entraste, pero no pudimos dejar tu cuenta lista todavía. Reintentá en unos minutos."
          : authErrorCode === "session_required"
            ? "Necesitamos que vuelvas a iniciar sesión para abrir tu Perfil de forma segura."
          : authErrorCode === "missing_user" || authErrorCode === "missing_code"
            ? "No pudimos cerrar ese ingreso. Probá de nuevo desde acá."
            : "No pudimos completar ese ingreso. Probá de nuevo.";
  }

  return (
    <PageStack>
      <section className="mx-auto grid gap-4 md:max-w-[30rem]" style={{ width: "min(326px, calc(100vw - 4rem))" }}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,50,125,0.1)] bg-white shadow-[0_8px_18px_rgba(0,50,125,0.08)]">
            <Image src={SOLIPRODE_BRAND_ASSETS.primaryLogo} alt="" width={28} height={28} className="h-7 w-7" priority />
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-primary)]">
            Prode Mundial solidario
          </span>
        </div>
        <div className="rounded-[1.35rem] border border-[#0d56bf] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_72%,#001a5c_100%)] p-5 text-white shadow-[0_18px_34px_rgba(0,50,125,0.18)]">
          <h1 className="font-serif text-[2.45rem] font-bold uppercase leading-[0.9] tracking-[-0.035em]">
            Entrá al Prode Mundial
          </h1>
          <p className="mt-3 text-[0.95rem] leading-6 text-[#dfe6ff]">
            Competí por premios, armá tu Team y ayudá a financiar una tesis universitaria.
          </p>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[1.15rem] border-[1.5px] border-[rgba(0,50,125,0.16)] bg-white p-4 shadow-[0_10px_24px_rgba(0,50,125,0.07)]">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-primary)]">
              Pozo inicial
            </p>
            <p className="mt-1 font-serif text-[2rem] font-bold leading-none text-[var(--color-primary)]">
              $300.000
            </p>
          </div>
          <span className="shrink-0 rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-2 py-2 text-center text-[9px] font-extrabold uppercase leading-tight tracking-[0.04em] text-[var(--color-ink)]">
            + premios
            <br />
            por Team
          </span>
        </div>
        <section className="rounded-[1.35rem] border-[1.5px] border-[var(--color-line)] bg-white p-4 shadow-[0_14px_30px_rgba(0,50,125,0.08)]">
          {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
          <LoginForm nextPath={nextPath} promoterCode={promoterCode} />
        </section>
      </section>
    </PageStack>
  );
}
