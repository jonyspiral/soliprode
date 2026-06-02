import { redirect } from "next/navigation";
import { CountryFlag } from "@/components/country-flag";
import { ActivationPanel } from "@/components/participation/activation-panel";
import {
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
        id: string;
        payment_status: string;
        created_at: string;
        payment_reference: string | null;
      }
    | null = null;
  let predictionCount = 0;
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

    const [
      { data: profileData },
      { data: participationData },
      { count: userPredictionCount },
    ] = await withSupabaseTimeout(
      Promise.all([
        supabase
          .from("profiles")
          .select("full_name, public_alias, whatsapp, email, role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("participations")
          .select("id, payment_status, created_at, payment_reference")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("predictions")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", user.id),
      ]),
      "Supabase dashboard query timed out",
    );

    profile = profileData;
    participation = participationData;
    predictionCount = userPredictionCount ?? 0;
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
  const participationStatus = participation?.payment_status ?? "pending";
  const participationActive = participationStatus === "paid";

  return (
    <PageStack>
      <section className="overflow-hidden rounded-lg bg-[var(--color-primary)] p-4 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
              Panel del jugador
            </p>
            <h1 className="mt-3 font-serif text-[2rem] font-bold uppercase leading-[0.95]">
              {`Hola${profile?.public_alias ? ` ${profile.public_alias}` : ""}!`}
              <br />
              <span className="text-[var(--color-gold-soft)]">
                {participationActive ? "Ya estás compitiendo." : "Te falta pagar para competir."}
              </span>
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#dfe6ff]">
              {profile?.email ?? userEmail ?? "Sin email"} · {participationActive ? "participación activa" : "pendiente de pago"}
            </p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 text-right">
            <p className="font-serif text-[1.7rem] font-bold leading-none">{predictionCount}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
              Pronósticos
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <HighlightMetric
          label="Inscripción"
          value={participationActive ? "paid" : "pendiente"}
          detail={
            participationActive
              ? "Tu participación ya está activa para competir por premios."
              : "Tu participación ya existe. Falta pagar con Mercado Pago para competir oficialmente."
          }
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
        <SurfaceCard tone="accent" title="Pago y activación">
          <ActivationPanel
            participationId={participation?.id ?? null}
            participationStatus={participationStatus}
            draftCount={predictionCount}
            initialPaymentReference={participation?.payment_reference ?? null}
          />
        </SurfaceCard>
      </section>

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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-soft)] font-serif text-2xl font-bold text-[var(--color-ink)]">
              3
            </div>
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
        <div className="overflow-hidden rounded-lg border-[1.5px] border-[var(--color-line)]">
          <div className="flex items-center justify-between bg-[var(--color-primary)] px-3 py-2 text-white">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em]">Fase de grupos</span>
            <span className="rounded-full bg-[var(--color-gold-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-ink)]">
              Hoy 20:30
            </span>
          </div>
          <div className="grid grid-cols-3 items-center bg-white p-4">
            <div className="text-center">
              <CountryFlag country="Argentina" label="Argentina" size="sm" className="mx-auto mb-1" />
              <p className="font-serif text-[1.35rem] font-bold text-[var(--color-ink)]">ARG</p>
            </div>
            <div className="text-center">
              <div className="inline-block rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-1 font-serif text-[1.4rem] font-bold text-[var(--color-ink)]">
                VS
              </div>
            </div>
            <div className="text-center">
              <CountryFlag country="Brasil" label="Brasil" size="sm" className="mx-auto mb-1" />
              <p className="font-serif text-[1.35rem] font-bold text-[var(--color-ink)]">BRA</p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Tu inscripción" description="Estado real actual de tu cuenta.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
              Estado actual
            </p>
            <p className="mt-2 font-serif text-4xl uppercase tracking-[0.06em] text-[var(--color-primary)]">
              {participationActive ? "paid" : "pendiente"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
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
