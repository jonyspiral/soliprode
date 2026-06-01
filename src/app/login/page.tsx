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
    authErrorMessage =
      "No pudimos revisar tu sesión en este momento. Igual podés intentar ingresar.";
  }

  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <PageStack>
      <PageHero
        title="Volvé a tu cuenta."
        description="Entrá con tu email y contraseña para seguir tu inscripción y tus próximos pasos dentro de SoliProde."
      />
      <SurfaceCard title="Ingresar" description="Usá la misma cuenta con la que te registraste.">
        {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
        <LoginForm nextPath={nextPath} />
      </SurfaceCard>
    </PageStack>
  );
}
