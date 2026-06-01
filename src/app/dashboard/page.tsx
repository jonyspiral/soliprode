import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import { ActionTile, InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

export default async function DashboardPage() {
  let hasAuthenticatedUser = false;
  let userEmail: string | null = null;
  let profile:
    | {
        full_name: string | null;
        public_alias: string;
        whatsapp: string | null;
        email: string | null;
        role: string;
      }
    | null = null;
  let participation:
    | {
        payment_status: string;
        created_at: string;
      }
    | null = null;
  let fallbackMessage =
    "No pudimos revisar tu sesión en este momento. Reintentá en unos minutos o volvé a ingresar.";

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    if (!user) {
      redirect("/login");
    }

    hasAuthenticatedUser = true;
    userEmail = user.email ?? null;

    [{ data: profile }, { data: participation }] = await withSupabaseTimeout(
      Promise.all([
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
      ]),
      "Supabase dashboard query timed out",
    );
  } catch {
    if (hasAuthenticatedUser) {
      fallbackMessage =
        "Tu sesión está abierta, pero no pudimos leer tu cuenta completa. Reintentá en unos minutos.";
    }
  }

  if (!hasAuthenticatedUser) {
    return (
      <PageStack>
        <PageHero title="Tu panel." description="No pudimos revisar tu acceso en este momento." />
        <SurfaceCard title="Estado temporal" description="Podés volver a intentar en unos minutos.">
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  if (hasAuthenticatedUser && !profile && !participation) {
    return (
      <PageStack>
        <PageHero title="Tu panel." description="No pudimos cargar tu cuenta en este momento." />
        <SurfaceCard title="Estado temporal" description="Tu sesión existe, pero falta recuperar tus datos.">
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  const participationDate = participation
    ? new Date(participation.created_at).toLocaleDateString("es-AR")
    : "Pendiente";

  return (
    <PageStack>
      <PageHero
        title={`Hola${profile?.public_alias ? `, ${profile.public_alias}` : ""}.`}
        description="Este es tu punto de entrada para revisar tu cuenta, tu inscripción y los próximos pasos del torneo."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Inscripción"
          value={participation?.payment_status ?? "pending"}
          detail="Tu participación inicial queda creada en estado pendiente."
        />
        <StatCard
          label="Alias"
          value={profile?.public_alias ?? "Pendiente"}
          detail="Es el nombre con el que vas a aparecer en competencia."
        />
        <StatCard
          label="Email"
          value={profile?.email ?? userEmail ?? "Sin email"}
          detail="Cuenta con la que ingresaste a SoliProde."
        />
        <StatCard
          label="WhatsApp"
          value={profile?.whatsapp ?? "Opcional"}
          detail="Lo usamos como dato de contacto cuando esté disponible."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard
          title="Tu inscripción"
          description="Acá ves el estado actual de tu cuenta dentro del torneo."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Estado actual
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                {participation?.payment_status ?? "pending"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Cuando el flujo completo esté operativo, desde acá también vas a seguir el avance
                de tu inscripción.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Fecha de alta
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                {participationDate}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Tu participación ya fue creada y quedó asociada a esta cuenta.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Qué sigue"
          description="El panel ya te marca el próximo paso sin mandarte a buscarlo entre módulos."
        >
          <div className="grid gap-4">
            <ActionTile
              title="Esperar el fixture"
              description="Cuando los partidos estén cargados, el próximo paso principal va a ser pronosticar desde la pantalla de Partidos."
              actionLabel="Ir a Partidos"
            />
            <ActionTile
              title="Completar tu contexto"
              description="Más adelante vas a poder sumarte a un grupo o una comunidad sin rehacer tu cuenta."
              actionLabel="Ver opciones"
            />
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard title="Tu cuenta" description="Datos básicos guardados hasta ahora.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Nombre
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
              {profile?.full_name ?? "Pendiente"}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Rol
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-[var(--color-ink)]">
              {profile?.role ?? "player"}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Cuenta
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
              {profile?.email ?? userEmail ?? "Sin email"}
            </p>
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
