import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
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
    authErrorMessage = "No pudimos revisar tu sesión ahora. Igual podés intentar ingresar.";
  }

  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <PageStack>
      <section className="-mx-4 -mt-2 overflow-hidden rounded-b-[2rem] bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] px-4 pb-8 pt-8 text-center text-white shadow-[0_18px_42px_rgba(0,50,125,0.28)]">
        <div className="mx-auto max-w-[20rem]">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
            Ingreso de jugadores
          </div>
          <h1 className="mt-5 font-serif text-[2.5rem] font-bold uppercase leading-[0.94] tracking-[-0.03em]">
            Volvé a tu panel
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#dfe6ff]">
            Entrá con tu cuenta para seguir tu inscripción, tus partidos y tu lugar en la tabla.
          </p>
        </div>
      </section>
      <SurfaceCard title="Ingresar" description="Usá la misma cuenta con la que te registraste.">
        {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
        <LoginForm nextPath={nextPath} />
      </SurfaceCard>
    </PageStack>
  );
}
