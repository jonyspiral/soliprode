import { redirect } from "next/navigation";
import { PageHero } from "@/components/page-hero";
import {
  ActionTile,
  InfoNotice,
  PageStack,
  ScopeCard,
  StatCard,
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
    "No pudimos validar tu sesión con Supabase en este momento. Reintentá en unos minutos o volvé a ingresar.";

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
        "Tu sesión existe, pero no pudimos leer tu perfil o participación. Reintentá en unos minutos o volvé a ingresar.";
    }
  }

  if (!hasAuthenticatedUser) {
    return (
      <PageStack>
        <PageHero
          title="Tu panel de juego."
          description="No pudimos validar tu sesión con Supabase en este momento."
        />
        <SurfaceCard
          title="Estado temporal"
          description="Fallback seguro cuando Supabase no responde durante la validación de sesión."
        >
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  if (hasAuthenticatedUser && !profile && !participation) {
    return (
      <PageStack>
        <PageHero
          title="Tu panel de juego."
          description="No pudimos cargar tu perfil desde Supabase en este momento."
        />
        <SurfaceCard title="Estado temporal" description="Fallback seguro cuando Supabase no responde.">
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  return (
    <PageStack>
      <PageHero
        title="Tu panel de juego."
        description="Vista protegida por sesión. La base ya ordena perfil, inscripción y superficies de competencia para sumar puntos, pronósticos y comunidades sin rehacer el panel."
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
          value={profile?.email ?? userEmail ?? "Sin email"}
          detail="Cuenta autenticada actual."
        />
        <StatCard
          label="WhatsApp"
          value={profile?.whatsapp ?? "No cargado"}
          detail="Contacto opcional para próximas etapas."
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard
          title="Próximo foco del jugador"
          description="El panel queda preparado para abrir siempre con la acción más importante del torneo."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ActionTile
              title="Próximo partido a pronosticar"
              description="Brasil vs Argentina · Miércoles 18 Jun · 20:00. Este bloque va a concentrar el CTA principal del jugador."
              actionLabel="Cargar pronóstico"
            />
            <ActionTile
              title="Estado de tu circuito"
              description="Tu participación ya existe y el siguiente paso funcional es completar predicciones, grupos y comunidad."
              actionLabel="Ver estado"
            />
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Capas de competencia"
          description="La estructura ya distingue claramente los distintos planos del juego."
        >
          <div className="grid gap-4">
            <ScopeCard
              title="General"
              summary="Posición contra todos los jugadores del torneo."
              status="Visible"
              detail="Este alcance va a combinar puntos por partido, bonus y ritmo de aciertos."
            />
            <ScopeCard
              title="Grupo"
              summary="Comparación cerrada entre amigos, oficina o equipo."
              status="Reservado"
              detail="Queda listo para integrarse apenas exista la asignación real a grupos."
            />
            <ScopeCard
              title="Comunidad"
              summary="Vista compartida por oficina o comunidad organizadora."
              status="Reservado"
              detail="La idea es sostener identidad colectiva sin perder la tabla general."
            />
          </div>
        </SurfaceCard>
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
