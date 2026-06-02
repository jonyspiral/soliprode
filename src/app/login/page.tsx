import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
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
      authErrorCode === "confirm_failed"
        ? "La vuelta desde Google no salió como esperábamos. Probá de nuevo."
        : authErrorCode === "bootstrap_failed"
          ? "Entraste, pero no pudimos dejar tu cuenta lista todavía. Reintentá en unos minutos."
          : authErrorCode === "missing_user" || authErrorCode === "missing_code"
            ? "No pudimos cerrar ese ingreso. Probá de nuevo desde acá."
            : "No pudimos completar ese ingreso. Probá de nuevo.";
  }

  return (
    <PageStack>
      <section className="-mx-4 -mt-2 overflow-hidden bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] px-4 pb-8 pt-10 text-center text-white">
        <div className="mx-auto max-w-[18rem]">
          <h1 className="font-serif text-[2.35rem] font-bold uppercase leading-[0.94] tracking-[-0.03em]">
            Entrá al Prode
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#dfe6ff]">
            Cargá tus pronósticos, sumá puntos y peleá el ranking.
          </p>
        </div>
      </section>
      <SurfaceCard title="Volvé al juego" description="Google te mete más rápido. Email queda como segunda jugada.">
        {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
        <LoginForm nextPath={nextPath} promoterCode={promoterCode} />
      </SurfaceCard>
    </PageStack>
  );
}
