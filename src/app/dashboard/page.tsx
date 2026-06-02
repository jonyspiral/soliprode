import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import {
  ActionTile,
  HighlightMetric,
  InfoNotice,
  PageStack,
} from "@/components/placeholder-primitives";
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
        <PageHero
          title="Tu panel."
          description="No pudimos revisar tu acceso en este momento."
          tone="stadium"
        />
        <SurfaceCard title="Estado temporal" description="Podés volver a intentar en unos minutos.">
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  if (hasAuthenticatedUser && !profile && !participation) {
    return (
      <PageStack>
        <PageHero
          title="Tu panel."
          description="No pudimos cargar tu cuenta en este momento."
          tone="stadium"
        />
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
        title={`Bienvenido${profile?.public_alias ? `, ${profile.public_alias}` : ""}.`}
        description="Desde acá seguís tu estado actual, tu cuenta y el próximo movimiento dentro del torneo."
        tone="stadium"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HighlightMetric
          label="Inscripción"
          value={participation?.payment_status ?? "pending"}
          detail="Tu participación ya quedó creada."
        />
        <HighlightMetric
          label="Alias"
          value={profile?.public_alias ?? "Pendiente"}
          detail="Así aparecés en la competencia."
        />
        <HighlightMetric
          label="Cuenta"
          value={profile?.email ?? userEmail ?? "Sin email"}
          detail="Email principal de acceso."
        />
        <HighlightMetric
          label="WhatsApp"
          value={profile?.whatsapp ?? "Opcional"}
          detail="Dato de contacto adicional."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard
          tone="primary"
          title="Tu inscripción"
          description="Esta es la referencia principal de tu estado actual dentro de SoliProde."
        >
          <div className="grid gap-4 md:grid-cols-2 text-white">
            <div className="border border-white/20 bg-white/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Estado actual
              </p>
              <p className="mt-2 font-serif text-4xl uppercase tracking-[0.06em]">
                {participation?.payment_status ?? "pending"}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/84">
                Tu alta ya existe. Cuando el torneo avance, acá también vas a seguir lo que te falta.
              </p>
            </div>
            <div className="border border-white/20 bg-white/10 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Fecha de alta
              </p>
              <p className="mt-2 font-serif text-4xl uppercase tracking-[0.06em]">
                {participationDate}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/84">
                La participación quedó asociada a esta cuenta y lista para seguir avanzando.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Qué sigue"
          description="La app te marca la próxima acción importante sin llenarte de módulos vacíos."
        >
          <div className="grid gap-4">
            <ActionTile
              title="Prepararte para el fixture"
              description="Cuando los partidos estén publicados, vas a cargar tus resultados desde Partidos y seguir todo desde el teléfono."
              actionLabel="Ver Partidos"
            />
            <ActionTile
              title="Sumarte a tu espacio"
              description="Grupo y comunidad quedan para el siguiente paso, una vez que ya tengas la cuenta lista."
              actionLabel="Explorar"
              tone="gold"
            />
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard title="Tu cuenta" description="Información básica ya guardada para volver a entrar sin fricción.">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Nombre
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">
              {profile?.full_name ?? "Pendiente"}
            </p>
          </div>
          <div className="border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Rol
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-[var(--color-ink)]">
              {profile?.role ?? "player"}
            </p>
          </div>
          <div className="border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
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
