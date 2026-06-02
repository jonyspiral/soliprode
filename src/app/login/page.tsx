import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { PageHero } from "@/components/page-hero";
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
      <PageHero
        title="Volvé a la competencia"
        description="Ingresá con tu cuenta para seguir tu inscripción, tus partidos y tus posiciones."
      />
      <SurfaceCard title="Ingresar" description="Usá la misma cuenta con la que te registraste.">
        {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
        <LoginForm nextPath={nextPath} />
      </SurfaceCard>
    </PageStack>
  );
}
