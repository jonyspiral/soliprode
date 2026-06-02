import { redirect } from "next/navigation";
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
        <SurfaceCard title="Estado temporal" description="Podés volver a intentar en unos minutos.">
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  if (hasAuthenticatedUser && !profile && !participation) {
    return (
      <PageStack>
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
      <section className="rounded-xl bg-[var(--color-primary)] p-4 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-bold uppercase leading-[0.95]">
              {`Hola${profile?.public_alias ? ` ${profile.public_alias}` : ""}!`}
              <br />
              <span className="text-[var(--color-gold-soft)]">Tu cuenta sigue en juego.</span>
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#dfe6ff]">
              {profile?.email ?? userEmail ?? "Sin email"} · {participation?.payment_status ?? "pending"}
            </p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-3">
            <p className="font-serif text-[1.7rem] font-bold leading-none">1,240</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
              Puntos totales
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
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
        <SurfaceCard tone="accent" title="Qué sigue">
          <ActionTile
            title="Prepararte para el fixture"
            description="Cuando se carguen los partidos, tu acción principal va a pasar por la pantalla de pronósticos."
            actionLabel="Ir a Partidos"
            tone="gold"
          />
        </SurfaceCard>
      </section>

      <div className="grid gap-4">
        <SurfaceCard title="Tu evolución" description="Lectura rápida del envión que va a tomar tu panel durante el torneo.">
          <div className="grid gap-4">
            <div className="relative flex h-44 items-end justify-between pt-4">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                <div className="w-full border-t border-[var(--color-line)]/50" />
                <div className="w-full border-t border-[var(--color-line)]/50" />
                <div className="w-full border-t border-[var(--color-line)]/50" />
                <div className="w-full border-t border-[var(--color-line)]/50" />
              </div>
              {["40%", "55%", "45%", "70%", "85%"].map((height, index) => (
                <div
                  key={height}
                  className={[
                    "relative z-10 w-[12%] rounded-t-sm",
                    index === 4
                      ? "border border-[var(--color-primary)] bg-[var(--color-primary)] shadow-[0_0_8px_rgba(154,225,255,0.4)]"
                      : index === 2
                        ? "border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-soft)]"
                        : "bg-[var(--color-surface-muted)]",
                  ].join(" ")}
                  style={{ height }}
                />
              ))}
            </div>
            <div className="flex justify-between px-2 text-[12px] font-medium text-[var(--color-muted)]">
              <span>F1</span>
              <span>F2</span>
              <span>F3</span>
              <span>F4</span>
              <span className="font-bold text-[var(--color-primary)]">F5</span>
            </div>
          </div>
        </SurfaceCard>

        <section className="grid gap-4 sm:grid-cols-2">
          <SurfaceCard tone="accent" title="Racha actual">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Momentum
                </p>
                <p className="mt-2 font-serif text-[1.9rem] font-bold uppercase text-[var(--color-ink)]">
                  3 plenos
                </p>
              </div>
              <span className="text-4xl">🔥</span>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Tu cuenta">
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Nombre
                </span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {profile?.full_name ?? "Pendiente"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  WhatsApp
                </span>
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {profile?.whatsapp ?? "Opcional"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  Rol
                </span>
                <span className="text-sm font-semibold capitalize text-[var(--color-ink)]">
                  {profile?.role ?? "player"}
                </span>
              </div>
            </div>
          </SurfaceCard>
        </section>

        <SurfaceCard title="Próximos partidos" description="Vista rápida de lo que vas a seguir desde el panel.">
          <div className="grid gap-3">
            <div className="overflow-hidden rounded-xl border-2 border-[var(--color-line)]">
              <div className="flex items-center justify-between bg-[var(--color-primary)] px-3 py-1 text-white">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Liga profesional</span>
                <span className="rounded-full bg-[var(--color-gold-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-ink)]">Hoy 20:30</span>
              </div>
              <div className="grid grid-cols-3 items-center bg-white p-4">
                <div className="text-center">
                  <p className="font-semibold text-[var(--color-ink)]">Boca</p>
                </div>
                <div className="text-center">
                  <div className="inline-block rounded border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-1 font-serif text-[1.5rem] font-bold text-[var(--color-ink)]">
                    2 - 1
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[var(--color-ink)]">River</p>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard title="Tu inscripción" description="Estado real actual de tu cuenta.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Estado actual
            </p>
            <p className="mt-2 font-serif text-4xl uppercase tracking-[0.06em] text-[var(--color-primary)]">
              {participation?.payment_status ?? "pending"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Fecha de alta
            </p>
            <p className="mt-2 font-serif text-4xl uppercase tracking-[0.06em] text-[var(--color-primary)]">
              {participationDate}
            </p>
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
