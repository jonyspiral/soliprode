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
      <section className="-mx-4 -mt-2 overflow-hidden bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] px-4 pb-8 pt-10 text-center text-white">
        <div className="mx-auto max-w-[18rem]">
          <h1 className="font-serif text-[2.35rem] font-bold uppercase leading-[0.94] tracking-[-0.03em]">
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
