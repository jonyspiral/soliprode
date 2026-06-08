import Link from "next/link";
import { redirect } from "next/navigation";
import { HomeHero } from "@/components/home/home-hero";
import { HomeLanding } from "@/components/home/home-landing";
import { HomeMatchList } from "@/components/home/home-match-list";
import { RulesHomeCard } from "@/components/home/rules-home-card";
import { RankingPodiumBlocks } from "@/components/rankings/ranking-podium-blocks";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { getHomeCommunityFeed } from "@/lib/home/community-feed";
import { getPlayerHeroState } from "@/lib/home/player-hero-state";
import { entryConfig } from "@/lib/product/entry-config";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { resolveParticipationUiState } from "@/lib/participations/status";
import { syncPendingPaymentAttemptsForParticipation } from "@/lib/payments/payment-attempts";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

const SYNCABLE_PAYMENT_STATUSES = new Set([
  "payment_started",
  "payment_pending",
  "manual_review",
]);

type DashboardProfile = {
  full_name: string | null;
  public_alias: string;
  whatsapp: string | null;
  email: string | null;
};

type DashboardParticipation = {
  id: string;
  payment_status: string;
  created_at: string;
};

type DashboardPageProps = {
  searchParams?: Promise<{
    account_ready?: string;
  }>;
};

async function loadDashboardAccountData(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  const [{ data: profileData }, { data: participationRows }] =
    await withSupabaseTimeout(
      Promise.all([
        supabase
          .from("profiles")
          .select("full_name, public_alias, whatsapp, email, role")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("participations")
          .select("id, payment_status, created_at")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]),
      "Supabase dashboard query timed out",
    );

  return {
    participation: pickPrimaryParticipation(participationRows ?? []).participation as
      | DashboardParticipation
      | null,
    profile: (profileData as DashboardProfile | null) ?? null,
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const alreadyRetriedAccountBootstrap = params?.account_ready === "1";
  let shouldReloadAfterAccountBootstrap = false;
  let hasAuthenticatedUser = false;
  let currentUserId: string | null = null;
  let profile: DashboardProfile | null = null;
  let participation: DashboardParticipation | null = null;
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

    let accountData = await loadDashboardAccountData(supabase, user.id);

    if (!accountData.profile || !accountData.participation) {
      const bootstrapResult = await ensureRegisteredUserRecords(user);

      if (!bootstrapResult.ok) {
        throw new Error("dashboard_bootstrap_failed");
      }

      if (!alreadyRetriedAccountBootstrap) {
        shouldReloadAfterAccountBootstrap = true;
      } else {
        accountData = await loadDashboardAccountData(supabase, user.id);
      }
    }

    profile = accountData.profile;
    participation = accountData.participation;

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
  } catch {
    if (hasAuthenticatedUser) {
      fallbackMessage =
        "Tu sesión está abierta, pero no pudimos leer tu cuenta completa. Reintentá en unos minutos.";
    }
  }

  if (shouldReloadAfterAccountBootstrap) {
    redirect("/dashboard?account_ready=1");
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
        <SurfaceCard
          title="Activá tu Pase Solidario"
          description="Con tu pase activo ya podés cargar pronósticos, armar tu Team y competir por premios."
        >
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              No necesitás cuenta de Mercado Pago. El pago online se hace con los medios disponibles y la activación se confirma automáticamente.
            </p>
            <Link
              href="/activar-pase"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              Ir a activar mi Pase
            </Link>
          </div>
        </SurfaceCard>
      </PageStack>
    );
  }

  return (
    <PageStack>
      <div className="home-landing-shell">
        <HomeHero entryPrice={entryConfig.initialPrice.toLocaleString("es-AR")} state={heroState} />
      </div>

      <RankingPodiumBlocks
        hasComputedResults={
          communityFeed.rankings.individual.some((entry) => entry.points > 0) ||
          communityFeed.rankings.groups.some((entry) => entry.points > 0)
        }
        individual={communityFeed.rankings.individual.map((entry) => ({
          key: entry.key,
          label: entry.label,
          points: entry.points,
          position: entry.position,
          avatarUrl: entry.avatarUrl,
        }))}
        teams={communityFeed.rankings.groups.map((entry) => ({
          key: entry.key,
          name: entry.name,
          points: entry.points,
          position: entry.position,
          activeCount: entry.activeCount,
        }))}
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

      <RulesHomeCard href="/reglamento" />

      <section className="grid gap-4 md:grid-cols-2">
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
      </section>
    </PageStack>
  );
}
