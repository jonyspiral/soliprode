import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { InfoNotice } from "@/components/placeholder-primitives";
import { LoginForm } from "@/components/auth/login-form";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  } catch {
    authErrorMessage =
      "No pudimos validar tu sesión con Supabase en este momento. Podés intentar ingresar igual o reintentar en unos minutos.";
  }

  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next?.startsWith("/") ? params.next : "/dashboard";

  return (
    <PageStack>
      <PageHero
        title="Ingresá a tu cuenta."
        description="Accedé con tu email y contraseña para entrar al panel de SoliProde y retomar tu inscripción."
      />
      <SurfaceCard
        title="Acceso"
        description="Primer flujo real de login sobre Supabase Auth. La recuperación de acceso queda para la próxima iteración."
      >
        {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
        <LoginForm nextPath={nextPath} />
      </SurfaceCard>
    </PageStack>
  );
}
