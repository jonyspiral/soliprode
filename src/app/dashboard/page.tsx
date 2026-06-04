import Link from "next/link";
import { redirect } from "next/navigation";
import { HomeHero } from "@/components/home/home-hero";
import { HomeLanding } from "@/components/home/home-landing";
import { HomeMatchList } from "@/components/home/home-match-list";
import { HomeRankingList } from "@/components/home/home-ranking-list";
import {
  InfoNotice,
  PageStack,
  StatCard,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { formatZoneLabel } from "@/lib/fixture/zone-labels";
import { getHomeCommunityFeed } from "@/lib/home/community-feed";
import { getPlayerHeroState } from "@/lib/home/player-hero-state";
import { getPlayerDisplayName } from "@/lib/player/identity";
import { entryConfig } from "@/lib/product/entry-config";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { resolveParticipationUiState } from "@/lib/participations/status";
import { syncPendingPaymentAttemptsForParticipation } from "@/lib/payments/payment-attempts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type UpcomingMatch = {
  id: string;
  round_name: string;
  group_code: string | null;
  starts_at: string;
  home_team: {
    fifa_code: string;
    name: string;
  }[] | null;
  away_team: {
    fifa_code: string;
    name: string;
  }[] | null;
};

const SYNCABLE_PAYMENT_STATUSES = new Set([
  "payment_started",
  "payment_pending",
  "manual_review",
]);

function formatStartsAt(startsAt: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

export default async function DashboardPage() {
  let hasAuthenticatedUser = false;
  let currentUserId: string | null = null;
  let profile:
    | {
        full_name: string | null;
        public_alias: string;
        whatsapp: string | null;
        email: string | null;
      }
    | null = null;
  let participation:
    | {
        id: string;
        payment_status: string;
        created_at: string;
        payment_reference: string | null;
        payment_submitted_at: string | null;
      }
    | null = null;
  let predictionCount = 0;
  let upcomingMatches: UpcomingMatch[] = [];
  let fallbackMessage =
    "No pudimos revisar tu sesión ahora. Reintentá en unos minutos o volvé a entrar.";

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    if (!user) {
      redirect("/login");
    }

    hasAuthenticatedUser = true;
    currentUserId = user.id;

    const [
      { data: profileData },
      { data: participationRows },
      { count: userPredictionCount },
      { data: upcomingMatchRows },
    ] = await withSupabaseTimeout(
      Promise.all([
        supabase
          .from("profiles")
          .select("full_name, public_alias, whatsapp, email, role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("participations")
          .select("id, payment_status, created_at, payment_reference, payment_submitted_at")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(2),
        supabase
          .from("predictions")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", user.id),
        supabase
          .from("matches")
          .select(
            `
              id,
              round_name,
              group_code,
              starts_at,
              home_team:teams!matches_home_team_id_fkey(fifa_code, name),
              away_team:teams!matches_away_team_id_fkey(fifa_code, name)
            `,
          )
          .eq("status", "scheduled")
          .gt("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(2),
      ]),
      "Supabase dashboard query timed out",
    );

    profile = profileData;
    participation = pickPrimaryParticipation(participationRows ?? []).participation;

    if (participation && SYNCABLE_PAYMENT_STATUSES.has(participation.payment_status)) {
      try {
        const paymentSync = await syncPendingPaymentAttemptsForParticipation(participation.id);
        const syncedStatus = paymentSync?.syncResult.participationStatus;

        if (syncedStatus) {
          participation = {
            ...participation,
            payment_status: syncedStatus,
          };
        }
      } catch (error) {
        console.error("[payments:dashboard-sync] failed", {
          participationId: participation.id,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }
    }

    predictionCount = userPredictionCount ?? 0;
    upcomingMatches = (upcomingMatchRows ?? []) as UpcomingMatch[];
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

  const participationStatus = participation?.payment_status ?? "pending";
  const participationUiState = resolveParticipationUiState(participationStatus);
  const participationActive = participationUiState.isPaid;
  const aliasLabel = getPlayerDisplayName(profile);
  const stateLabel = participationUiState.statusLabel;
  const picksLabel = `${predictionCount} pronóstico${predictionCount === 1 ? "" : "s"} cargado${predictionCount === 1 ? "" : "s"}`;

  if (!currentUserId) {
    return (
      <PageStack>
        <SurfaceCard title="Estado temporal" description="Tu sesión existe, pero falta identificar al jugador.">
          <InfoNotice tone="error" message={fallbackMessage} />
        </SurfaceCard>
      </PageStack>
    );
  }

  const heroState = await getPlayerHeroState({
    userId: currentUserId,
    isPaid: participationActive,
  });
  const communityFeed = await getHomeCommunityFeed();

  if (!participationActive) {
    return (
      <PageStack>
        <HomeLanding entryPrice={entryConfig.initialPrice} heroState={heroState} />
      </PageStack>
    );
  }

  return (
    <PageStack>
      <div className="home-landing-shell">
        <HomeHero entryPrice={entryConfig.initialPrice.toLocaleString("es-AR")} state={heroState} />
      </div>

      <HomeRankingList
        title="Ranking individual"
        description="Top jugadores con puntaje oficial."
        entries={communityFeed.rankings.individual}
        emptyMessage="Todavía no hay ranking individual publicado."
      />

      <HomeRankingList
        title="Ranking grupal"
        description="Teams con mejor puntaje acumulado."
        entries={communityFeed.rankings.groups}
        emptyMessage="Todavía no hay ranking grupal publicado."
        tone="group"
      />

      <HomeMatchList matches={communityFeed.matches} />

      <SurfaceCard title="Ya estás compitiendo" description="Seguí cargando tus pronósticos y mirá cómo viene la tabla.">
        <div className="grid gap-3 md:grid-cols-2">
          <Link
            href="/matches"
            className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
          >
            Cargá tus pronósticos
          </Link>
          <Link
            href="/rankings"
            className="inline-flex min-h-14 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
          >
            Ver ranking
          </Link>
        </div>
      </SurfaceCard>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tus pronósticos" value={String(predictionCount)} detail={picksLabel} />
        <StatCard
          label="Estado"
          value={stateLabel}
          detail="Aporte confirmado y ranking activo."
        />
        <StatCard label="Nick de juego" value={aliasLabel} detail="Así aparecés en el torneo." />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SurfaceCard title="Estado de juego">
          <div className="grid gap-3">
            <p className="font-serif text-[1.9rem] font-bold uppercase text-[var(--color-primary)]">
              {stateLabel}
            </p>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {participationUiState.supportText}
            </p>
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                Tus pronósticos
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--color-ink)]">
                {picksLabel}
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Próximos partidos">
          {upcomingMatches.length > 0 ? (
            <div className="grid gap-3">
              {upcomingMatches.map((match) => {
                const homeTeam = match.home_team?.[0];
                const awayTeam = match.away_team?.[0];

                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
                      {match.round_name}
                      {match.group_code ? ` • ${formatZoneLabel(match.group_code)}` : ""}
                    </p>
                    <p className="mt-2 font-serif text-[1.35rem] font-bold uppercase text-[var(--color-ink)]">
                      {homeTeam?.fifa_code ?? "LOC"} vs {awayTeam?.fifa_code ?? "VIS"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                      {formatStartsAt(match.starts_at)}
                    </p>
                  </div>
                );
              })}
              <Link
                href="/matches"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
              >
                Ir a partidos
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                Todavía no hay partidos cargados.
              </p>
              <Link
                href="/matches"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
              >
                Ir a partidos
              </Link>
            </div>
          )}
        </SurfaceCard>

        <div className="grid gap-4">
          <SurfaceCard title="Racha">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Racha: se activa cuando empiecen a jugarse los partidos.
            </p>
          </SurfaceCard>
          <SurfaceCard title="Tu evolución">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Tu evolución aparecerá cuando haya resultados cargados.
            </p>
          </SurfaceCard>
        </div>
      </section>
    </PageStack>
  );
}
