import Link from "next/link";
import { redirect } from "next/navigation";
import { confirmParticipationAction, publishMatchResultAction } from "@/app/admin/actions";
import { PageHero } from "@/components/page-hero";
import { InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { SurfaceCard } from "@/components/surface-card";
import { requireAdminUser } from "@/lib/admin/access";
import { getPlayerAvatarModel, getPlayerDisplayName } from "@/lib/player/identity";
import { formatEntryPrice } from "@/lib/product/entry-config";
import { getPromotersAdminSnapshot } from "@/lib/promoters/admin";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type ProfileAdminRow = {
  id: string;
  full_name: string | null;
  public_alias: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
};

type ParticipationAdminRow = {
  id: string;
  profile_id: string;
  group_id: string | null;
  promoter_id: string | null;
  payment_status: string;
  entry_price: number | string | null;
  created_at: string;
  paid_at: string | null;
};

type PromoterRefRow = {
  id: string;
  name: string;
  code: string;
};

type GroupRefRow = {
  id: string;
  name: string;
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

type RegisteredWithoutPassRow = {
  profile: ProfileAdminRow;
  participation: ParticipationAdminRow | null;
  promoterLabel: string | null;
  groupLabel: string | null;
  stateLabel: "Sin Pase" | "Pago pendiente" | "Pase activo";
};

function resolveNumericAmount(value: number | string | null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function resolveAdminPaymentState(paymentStatus: string | null | undefined) {
  if (paymentStatus === "paid") {
    return {
      isActive: true,
      isPending: false,
      label: "Pase activo" as const,
    };
  }

  if (paymentStatus && ["payment_started", "payment_pending", "manual_review"].includes(paymentStatus)) {
    return {
      isActive: false,
      isPending: true,
      label: "Pago pendiente" as const,
    };
  }

  return {
    isActive: false,
    isPending: false,
    label: "Sin Pase" as const,
  };
}

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

  let adminNotice: string | null = null;
  let profiles: ProfileAdminRow[] = [];
  let participations: ParticipationAdminRow[] = [];
  let promoters: PromoterRefRow[] = [];
  let groups: GroupRefRow[] = [];
  let predictionCount = 0;
  let matchRows: MatchAdminRow[] = [];
  let promotersSnapshot: Awaited<ReturnType<typeof getPromotersAdminSnapshot>> | null = null;

  try {
    const adminSupabase = createServiceRoleSupabaseClient();
    const adminResults = await withSupabaseTimeout(
      Promise.all([
        adminSupabase
          .from("profiles")
          .select("id, full_name, public_alias, email, whatsapp, created_at")
          .order("created_at", { ascending: false }),
        adminSupabase
          .from("participations")
          .select("id, profile_id, group_id, promoter_id, payment_status, entry_price, created_at, paid_at")
          .order("created_at", { ascending: false }),
        adminSupabase.from("promoters").select("id, name, code"),
        adminSupabase.from("groups").select("id, name"),
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

    profiles = (adminResults[0].data ?? []) as ProfileAdminRow[];
    participations = (adminResults[1].data ?? []) as ParticipationAdminRow[];
    promoters = (adminResults[2].data ?? []) as PromoterRefRow[];
    groups = (adminResults[3].data ?? []) as GroupRefRow[];
    predictionCount = adminResults[4].count ?? 0;
    matchRows = (adminResults[5].data ?? []) as MatchAdminRow[];
    promotersSnapshot = adminResults[6];
  } catch {
    adminNotice =
      "No pudimos cargar el panel operativo completo. Reintentá en unos minutos o revisá la configuración del service role.";
  }

  const promoterMap = new Map(promoters.map((promoter) => [promoter.id, promoter]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const participationsByProfile = new Map<string, ParticipationAdminRow[]>();

  for (const participation of participations) {
    const existing = participationsByProfile.get(participation.profile_id) ?? [];
    existing.push(participation);
    participationsByProfile.set(participation.profile_id, existing);
  }

  const derivedRows = profiles.map<RegisteredWithoutPassRow>((profile) => {
    const participation =
      pickPrimaryParticipation(participationsByProfile.get(profile.id) ?? []).participation ?? null;
    const paymentState = resolveAdminPaymentState(participation?.payment_status);
    const promoter = participation?.promoter_id ? promoterMap.get(participation.promoter_id) ?? null : null;
    const group = participation?.group_id ? groupMap.get(participation.group_id) ?? null : null;

    return {
      profile,
      participation,
      promoterLabel: promoter ? `${promoter.name} (${promoter.code})` : null,
      groupLabel: group?.name ?? null,
      stateLabel: paymentState.label,
    };
  });

  const registeredCount = derivedRows.length;
  const activeRows = derivedRows.filter((row) => row.stateLabel === "Pase activo");
  const pendingRows = derivedRows.filter((row) => row.stateLabel === "Pago pendiente");
  const withoutPassRows = derivedRows.filter((row) => row.stateLabel !== "Pase activo");
  const confirmedRevenue = activeRows.reduce(
    (sum, row) => sum + resolveNumericAmount(row.participation?.entry_price ?? null),
    0,
  );
  const conversionRate = registeredCount > 0 ? Math.round((activeRows.length / registeredCount) * 100) : 0;

  return (
    <PageStack>
      <PageHero
        title="Admin"
        description="Operación mínima para activar jugadores, revisar pagos y sostener la recaudación real del torneo."
        tone="stadium"
      />

      {adminNotice ? <InfoNotice tone="error" message={adminNotice} /> : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Registrados" value={String(registeredCount)} detail="Perfiles creados" />
        <StatCard label="Sin Pase" value={String(withoutPassRows.length)} detail="Aún no están activos" />
        <StatCard label="Pagos pendientes" value={String(pendingRows.length)} detail="Esperan confirmación" />
        <StatCard label="Jugadores activos" value={String(activeRows.length)} detail="payment_status = paid" />
        <StatCard label="Conversión" value={`${conversionRate}%`} detail="Registro → Pase activo" />
        <StatCard label="Recaudado" value={formatEntryPrice(confirmedRevenue)} detail="Solo participations paid" />
      </section>

      <SurfaceCard
        title="Registrados sin Pase"
        description="Bandeja operativa para detectar quién todavía no activó, quién está pendiente y quién ya pasó a competir."
      >
        {withoutPassRows.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            No hay jugadores registrados sin Pase activo ahora mismo.
          </p>
        ) : (
          <div className="grid gap-4">
            {withoutPassRows
              .sort((left, right) => {
                const leftPriority = left.stateLabel === "Pago pendiente" ? 0 : 1;
                const rightPriority = right.stateLabel === "Pago pendiente" ? 0 : 1;

                if (leftPriority !== rightPriority) {
                  return leftPriority - rightPriority;
                }

                return Date.parse(right.profile.created_at) - Date.parse(left.profile.created_at);
              })
              .map((row) => {
                const profile = row.profile;
                const avatarModel = getPlayerAvatarModel(profile);
                const label = getPlayerDisplayName(profile);

                return (
                  <div
                    key={profile.id}
                    className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <PlayerAvatar
                          imageUrl={avatarModel.avatarUrl}
                          fallbackImageUrl={avatarModel.fallbackAvatarUrl}
                          label={label}
                          seed={avatarModel.avatarSeed}
                          size="md"
                          variant={avatarModel.avatarVariant}
                        />
                        <div className="grid gap-1">
                          <p className="font-semibold text-[var(--color-ink)]">{label}</p>
                          <p className="text-sm text-[var(--color-muted)]">
                            {profile.full_name ?? "Nombre pendiente"} · {profile.email ?? "Sin email"}
                          </p>
                          <p className="text-sm text-[var(--color-muted)]">
                            Alta: {new Date(profile.created_at).toLocaleDateString("es-AR")} · Estado: {row.stateLabel}
                          </p>
                          <p className="text-sm text-[var(--color-muted)]">
                            {row.groupLabel ? `Team: ${row.groupLabel}` : "Todavía sin Team"} ·{" "}
                            {row.promoterLabel ? `Promoter: ${row.promoterLabel}` : "Sin promoter"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:min-w-[180px]">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          {row.stateLabel}
                        </span>
                        {row.stateLabel === "Pago pendiente" && row.participation ? (
                          <form action={confirmParticipationAction}>
                            <input type="hidden" name="participation_id" value={row.participation.id} />
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                            >
                              Confirmar pago
                            </button>
                          </form>
                        ) : (
                          <Link
                            href="/activar-pase"
                            className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
                          >
                            Ver activación
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </SurfaceCard>

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

            <Link
              href="/admin/promoters"
              className="inline-flex w-fit items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              Ir al panel de Promoters
            </Link>
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            No pudimos cargar el resumen de Promoters en este momento.
          </p>
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
        description="Con esta base ya podés seguir la conversión real y confirmar jugadores cuando un pago quede pendiente."
      >
        <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
          <p>1. El jugador entra o se loguea y va directo a `/activar-pase`.</p>
          <p>2. Checkout Pro crea o reutiliza el intento trazable en `payment_attempts`.</p>
          <p>3. El webhook o la verificación server-side actualizan `participations.payment_status`.</p>
          <p>4. Si queda pendiente, Admin puede verlo y confirmarlo sin romper ranking ni recaudación.</p>
          <p>5. Hoy hay {predictionCount.toLocaleString("es-AR")} pronóstico(s) cargado(s) en total.</p>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
