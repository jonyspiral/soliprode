import { redirect } from "next/navigation";
import { confirmParticipationAction, publishMatchResultAction } from "@/app/admin/actions";
import { PageHero } from "@/components/page-hero";
import { InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { requireAdminUser } from "@/lib/admin/access";
import { formatEntryPrice } from "@/lib/product/entry-config";
import { getPromotersAdminSnapshot } from "@/lib/promoters/admin";
import {
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type PendingParticipationRow = {
  id: string;
  payment_status: string;
  created_at: string;
  payment_reference: string | null;
  paid_at: string | null;
  profile_id: string;
  profile: {
    full_name: string | null;
    public_alias: string;
    email: string | null;
    whatsapp: string | null;
  }[] | null;
};

type MatchAdminRow = {
  id: string;
  phase: string;
  group_name: string | null;
  starts_at: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
  home_team: {
    code: string;
    name: string;
  }[] | null;
  away_team: {
    code: string;
    name: string;
  }[] | null;
};

export default async function AdminPage() {
  try {
    await withSupabaseTimeout(requireAdminUser(), "Supabase admin access check timed out");
  } catch (error) {
    if (error instanceof Error && error.message === "unauthenticated") {
      redirect("/login?next=/admin");
    }

    return (
      <PageStack>
        <PageHero
          title="Admin"
          description="Superficie operativa reservada para administración del torneo."
          tone="stadium"
        />
        <SurfaceCard title="Acceso restringido" description="Necesitás perfil admin para operar esta sección.">
          <InfoNotice
            tone="error"
            message="Tu cuenta no tiene permisos de administración. Ingresá con un perfil admin para revisar pagos y activar participaciones."
          />
        </SurfaceCard>
      </PageStack>
    );
  }

  let pendingRows: PendingParticipationRow[] = [];
  let paidCount = 0;
  let pendingCount = 0;
  let predictionCount = 0;
  let matchRows: MatchAdminRow[] = [];
  let adminNotice: string | null = null;
  let promotersSnapshot: Awaited<ReturnType<typeof getPromotersAdminSnapshot>> | null = null;

  try {
    const adminSupabase = createServiceRoleSupabaseClient();
    const adminResults = await withSupabaseTimeout(
      Promise.all([
        adminSupabase
          .from("participations")
          .select(
            `
              id,
              payment_status,
              created_at,
              payment_reference,
              paid_at,
              profile_id,
              profile:profiles(full_name, public_alias, email, whatsapp)
            `,
          )
          .eq("payment_status", "pending")
          .order("created_at", { ascending: true }),
        adminSupabase
          .from("participations")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "paid"),
        adminSupabase
          .from("participations")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "pending"),
        adminSupabase.from("predictions").select("id", { count: "exact", head: true }),
        adminSupabase
          .from("matches")
          .select(
            `
              id,
              phase,
              group_name,
              starts_at,
              status,
              score_home,
              score_away,
              home_team:teams!matches_home_team_id_fkey(code, name),
              away_team:teams!matches_away_team_id_fkey(code, name)
            `,
          )
          .order("starts_at", { ascending: true })
          .limit(12),
        getPromotersAdminSnapshot(),
      ]),
      "Supabase admin query timed out",
    );
    const [pendingResult, paidResult, pendingCountResult, predictionCountResult, matchesResult, promotersResult] =
      adminResults;

    pendingRows = (((pendingResult.data ?? []) as PendingParticipationRow[])).map((row) => ({
      ...row,
      profile: row.profile ?? [],
    }));
    paidCount = paidResult.count ?? 0;
    pendingCount = pendingCountResult.count ?? 0;
    predictionCount = predictionCountResult.count ?? 0;
    matchRows = (matchesResult.data ?? []) as MatchAdminRow[];
    promotersSnapshot = promotersResult;
  } catch {
    adminNotice =
      "No pudimos cargar el panel operativo completo. Reintentá en unos minutos o revisá la configuración del service role.";
  }

  return (
    <PageStack>
      <PageHero
        title="Admin"
        description="Operación mínima para empezar a cobrar, revisar pendientes y activar participaciones."
        tone="stadium"
      />

      {adminNotice ? <InfoNotice tone="error" message={adminNotice} /> : null}

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Pendientes" value={String(pendingCount)} detail="Esperan confirmación manual" />
        <StatCard label="Activos" value={String(paidCount)} detail="Ya compiten oficialmente" />
        <StatCard label="Picks" value={String(predictionCount)} detail="Pronósticos cargados" />
      </section>

      <SurfaceCard
        title="Promoters"
        description="Resumen corto de la tracción comercial. La vista completa vive en Admin / Promoters."
      >
        {promotersSnapshot ? (
          <div className="grid gap-4">
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Promoters" value={String(promotersSnapshot.totals.promoterCount)} detail="Cargados en Admin" />
              <StatCard label="Activos" value={String(promotersSnapshot.totals.activePromoterCount)} detail="Con link operativo" />
              <StatCard label="Jugadores activos" value={String(promotersSnapshot.totals.activePlayersCount)} detail="Aportes confirmados" />
              <StatCard label="Recaudado" value={formatEntryPrice(promotersSnapshot.totals.totalRaised)} detail="Solo participations paid" />
            </section>

            {promotersSnapshot.ranking.length > 0 ? (
              <div className="grid gap-3">
                {promotersSnapshot.ranking.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">
                        #{entry.rankingPosition} {entry.name}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {entry.activePlayersCount} Jugadores activos · {entry.confirmedContributionsCount} Aportes confirmados
                      </p>
                    </div>
                    <p className="font-serif text-[1.4rem] uppercase text-[var(--color-primary)]">
                      {formatEntryPrice(entry.totalRaised)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                Todavía no hay Promoters o participaciones atribuidas para mostrar.
              </p>
            )}

            <a
              href="/admin/promoters"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              Ir al panel de Promoters
            </a>
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            No pudimos cargar el resumen de Promoters en este momento.
          </p>
        )}
      </SurfaceCard>

      <SurfaceCard
        title="Participaciones pendientes"
        description="Antes de Mercado Pago, esta es la bandeja operativa para confirmar pagos manuales."
      >
        {pendingRows.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            No hay participaciones pendientes ahora mismo.
          </p>
        ) : (
          <div className="grid gap-4">
            {pendingRows.map((row) => {
              const profile = row.profile?.[0] ?? null;

              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="grid gap-2">
                      <p className="font-serif text-[1.5rem] font-bold uppercase text-[var(--color-primary)]">
                        {profile?.public_alias ?? "Sin alias"}
                      </p>
                      <p className="text-sm text-[var(--color-ink)]">
                        {profile?.full_name ?? "Nombre pendiente"}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {profile?.email ?? "Sin email"} · {profile?.whatsapp ?? "WhatsApp opcional"}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Alta: {new Date(row.created_at).toLocaleDateString("es-AR")}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Referencia: {row.payment_reference?.trim() || "Todavía no cargó referencia o comprobante."}
                      </p>
                    </div>

                    <form action={confirmParticipationAction} className="sm:min-w-[180px]">
                      <input type="hidden" name="participation_id" value={row.id} />
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                      >
                        Confirmar pago
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard
        title="Resultados y scoring"
        description="Publicá resultados finales, recalculá puntos y reconstruí el ranking oficial desde la misma jugada."
      >
        {matchRows.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Todavía no hay partidos cargados para operar.
          </p>
        ) : (
          <div className="grid gap-4">
            {matchRows.map((match) => {
              const homeTeam = match.home_team?.[0];
              const awayTeam = match.away_team?.[0];

              return (
                <div
                  key={match.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="grid gap-1">
                      <p className="font-serif text-[1.35rem] font-bold uppercase text-[var(--color-primary)]">
                        {homeTeam?.code ?? "LOC"} vs {awayTeam?.code ?? "VIS"}
                      </p>
                      <p className="text-sm text-[var(--color-ink)]">
                        {homeTeam?.name ?? "Local"} vs {awayTeam?.name ?? "Visitante"}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {match.phase}
                        {match.group_name ? ` • Grupo ${match.group_name}` : ""} ·{" "}
                        {new Date(match.starts_at).toLocaleString("es-AR")}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Estado actual: {match.status}
                        {match.score_home !== null && match.score_away !== null
                          ? ` • ${match.score_home} - ${match.score_away}`
                          : ""}
                      </p>
                    </div>

                    <form action={publishMatchResultAction} className="grid gap-3 sm:min-w-[260px]">
                      <input type="hidden" name="match_id" value={match.id} />
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                            {homeTeam?.code ?? "LOC"}
                          </span>
                          <input
                            name="score_home"
                            type="number"
                            min="0"
                            defaultValue={match.score_home ?? 0}
                            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                            {awayTeam?.code ?? "VIS"}
                          </span>
                          <input
                            name="score_away"
                            type="number"
                            min="0"
                            defaultValue={match.score_away ?? 0}
                            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                      >
                        Publicar resultado y recalcular
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard
        title="Qué sigue"
        description="Con esta base ya podés empezar a operar manualmente mientras el cobro automático sigue pendiente."
      >
        <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
          <p>1. El jugador crea su cuenta y carga pronósticos.</p>
          <p>2. Guarda una referencia o comprobante desde su dashboard.</p>
          <p>3. El admin confirma manualmente y la participación pasa a activa.</p>
          <p>4. Desde ese momento, los pronósticos futuros ya compiten por premios y ranking oficial.</p>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
