import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: participation }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, public_alias, whatsapp, email, role")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("participations")
      .select("payment_status, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <PageStack>
      <PageHero
        title="Tu panel de juego."
        description="Vista protegida por sesión. Muestra el perfil base y el estado inicial de participación, sin pagos ni predicciones todavía."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Alias público"
          value={profile?.public_alias ?? "Pendiente"}
          detail="Nombre visible en rankings y competencia."
        />
        <StatCard
          label="Estado de inscripción"
          value={participation?.payment_status ?? "pending"}
          detail="La participación se crea en pending hasta el flujo de pago."
        />
        <StatCard
          label="Rol"
          value={profile?.role ?? "player"}
          detail="Rol inicial del usuario dentro del sistema."
        />
        <StatCard
          label="Email"
          value={profile?.email ?? user.email ?? "Sin email"}
          detail="Cuenta autenticada actual."
        />
        <StatCard
          label="WhatsApp"
          value={profile?.whatsapp ?? "No cargado"}
          detail="Contacto opcional para próximas etapas."
        />
      </section>
      <SurfaceCard title="Perfil base" description="Datos guardados al momento del alta.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Nombre completo
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
              {profile?.full_name ?? "Pendiente"}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Participación
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
              {participation
                ? `Creada ${new Date(participation.created_at).toLocaleDateString("es-AR")}`
                : "Pendiente de creación"}
            </p>
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
