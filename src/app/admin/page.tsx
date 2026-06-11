import Link from "next/link";
import { redirect } from "next/navigation";
import { ManualRecoveryPanel, type ManualRecoveryPanelRow } from "@/app/admin/manual-recovery-panel";
import {
  confirmParticipationAction,
  publishMatchResultAction,
  rejectParticipationAction,
  rebuildRankingsAction,
  sendBrevoRecoveryEmailsAction,
  sendBrevoRecoveryTestAction,
} from "@/app/admin/actions";
import { PageHero } from "@/components/page-hero";
import { InfoNotice, PageStack, StatCard } from "@/components/placeholder-primitives";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { SurfaceCard } from "@/components/surface-card";
import { getBrevoAdminStatus } from "@/lib/admin/brevo";
import { requireAdminUser } from "@/lib/admin/access";
import {
  MANUAL_RECOVERY_TEMPLATE_OPTIONS,
  buildManualRecoveryTemplateContent,
  getDefaultManualRecoveryTemplateKey,
  type ManualRecoveryRecipient,
  type ManualRecoveryTemplateKey,
} from "@/lib/admin/manual-recovery-email";
import { getPlayerAvatarModel, getPlayerDisplayName } from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { formatEntryPrice } from "@/lib/product/entry-config";
import { getPromotersAdminSnapshot } from "@/lib/promoters/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type AdminPageProps = {
  searchParams?: Promise<{
    ranking_notice?: string;
    send_error?: string;
    send_notice?: string;
    selected_profile_ids?: string;
    template_key?: string;
    test_context?: string;
    test_error?: string;
    test_notice?: string;
    test_proof?: string;
  }>;
};

type ProfileAdminRow = {
  id: string;
  full_name: string | null;
  public_alias: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string;
  avatar_url: string | null;
  avatar_seed: string | null;
  avatar_variant: string | null;
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

type MatchTeamRef = {
  code?: string | null;
  fifa_code?: string | null;
  name?: string | null;
  short_name?: string | null;
};

type MatchQueryRow = {
  id: string;
  phase: string | null;
  round_name: string | null;
  stage: string | null;
  group_name: string | null;
  group_code: string | null;
  starts_at: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
  home_team: MatchTeamRef | MatchTeamRef[] | null;
  away_team: MatchTeamRef | MatchTeamRef[] | null;
};

type MatchAdminRow = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamCode: string;
  awayTeamCode: string;
  startsAt: string;
  status: string;
  stage: string | null;
  roundName: string | null;
  groupCode: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
};

type PaymentAttemptAdminRow = {
  id: string;
  participation_id: string;
  provider: string;
  status: string;
  created_at: string;
};

type RegisteredWithoutPassRow = {
  profile: ProfileAdminRow;
  participation: ParticipationAdminRow | null;
  promoterLabel: string | null;
  groupLabel: string | null;
  stateLabel: "Sin Pase" | "Pago pendiente" | "Pase activo" | "Revisión manual";
  paymentStatusLabel: string;
  latestPaymentAttemptLabel: string | null;
  paymentAttempt: PaymentAttemptAdminRow | null;
  canCreateDraft: boolean;
};

const MANUAL_RECOVERY_PREVIEW_RECIPIENT: ManualRecoveryRecipient = {
  profileId: "preview",
  participationId: "preview",
  paymentAttemptId: null,
  email: "preview@soliprode.com",
  fullName: "Nombre de ejemplo",
  nickname: "Alias ejemplo",
  promoterLabel: null,
  groupLabel: null,
  paymentStatus: "pending",
  paymentAttemptStatus: null,
  paymentAttemptProvider: null,
};

function parseSelectedProfileIds(rawValue: string | null | undefined) {
  if (!rawValue) {
    return [];
  }

  return [...new Set(rawValue.split(",").map((value) => value.trim()).filter(Boolean))].sort();
}

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

function formatPaymentStatusValue(status: string | null | undefined) {
  if (!status) {
    return "pending";
  }

  return status.replaceAll("_", " ");
}

function formatPaymentProvider(provider: string | null | undefined) {
  if (!provider) {
    return "Sin provider";
  }

  if (provider === "mercadopago") {
    return "Mercado Pago";
  }

  if (provider === "bank_transfer") {
    return "Transferencia";
  }

  return provider.replaceAll("_", " ");
}

function formatPaymentAttemptLabel(attempt: PaymentAttemptAdminRow | null) {
  if (!attempt) {
    return null;
  }

  const date = new Date(attempt.created_at);
  const formattedDate = Number.isFinite(date.getTime())
    ? date.toLocaleString("es-AR")
    : attempt.created_at;

  return `${formatPaymentProvider(attempt.provider)} · ${formatPaymentStatusValue(attempt.status)} · ${formattedDate}`;
}

function normalizeMatchTeamRef(team: MatchTeamRef | MatchTeamRef[] | null | undefined) {
  if (!team) {
    return null;
  }

  return Array.isArray(team) ? (team[0] ?? null) : team;
}

function resolveAdminTeamName(team: MatchTeamRef | MatchTeamRef[] | null | undefined, fallback: string) {
  const normalized = normalizeMatchTeamRef(team);
  return normalized?.name?.trim() || normalized?.short_name?.trim() || fallback;
}

function resolveAdminTeamCode(team: MatchTeamRef | MatchTeamRef[] | null | undefined, fallback: string) {
  const normalized = normalizeMatchTeamRef(team);
  return normalized?.code?.trim() || normalized?.fifa_code?.trim() || fallback;
}

function formatMatchDateTime(startsAt: string) {
  const date = new Date(startsAt);

  if (!Number.isFinite(date.getTime())) {
    return startsAt;
  }

  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  const day = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);

  const safeWeekday = weekday ? weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(".", "") : "";
  return `${safeWeekday} ${day} · ${time}`;
}

function formatAdminMatchStatus(status: string | null | undefined) {
  if (!status) {
    return "pending";
  }

  return status.replaceAll("_", " ");
}

function formatAdminMatchMeta(match: Pick<MatchAdminRow, "stage" | "roundName" | "groupCode" | "startsAt">) {
  const parts: string[] = [];

  if (match.roundName?.trim()) {
    parts.push(match.roundName.trim());
  } else if (match.stage?.trim()) {
    parts.push(match.stage.trim());
  }

  if (match.groupCode?.trim()) {
    parts.push(`Zona ${match.groupCode.trim()}`);
  }

  parts.push(formatMatchDateTime(match.startsAt));

  return parts.join(" · ");
}

function resolveAdminPaymentState(paymentStatus: string | null | undefined) {
  if (paymentStatus === "paid") {
    return {
      isActive: true,
      canCreateDraft: false,
      label: "Pase activo" as const,
    };
  }

  if (paymentStatus === "manual_review") {
    return {
      isActive: false,
      canCreateDraft: false,
      label: "Revisión manual" as const,
    };
  }

  if (paymentStatus && ["payment_started", "payment_pending"].includes(paymentStatus)) {
    return {
      isActive: false,
      canCreateDraft: true,
      label: "Pago pendiente" as const,
    };
  }

  return {
    isActive: false,
    canCreateDraft: true,
    label: "Sin Pase" as const,
  };
}

function buildOriginLabel(row: RegisteredWithoutPassRow) {
  const parts = [];

  if (row.groupLabel) {
    parts.push(`Team: ${row.groupLabel}`);
  }

  if (row.promoterLabel) {
    parts.push(`Promoter: ${row.promoterLabel}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Sin promoter ni Team";
}

function ManualReviewRow({ row }: { row: RegisteredWithoutPassRow }) {
  const profile = row.profile;
  const avatarModel = getPlayerAvatarModel(profile);
  const label = getPlayerDisplayName(profile);

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
              Nombre: {profile.full_name ?? "Pendiente"} · Nickname: {profile.public_alias ?? "Pendiente"}
            </p>
            <p className="text-sm text-[var(--color-muted)]">Email: {profile.email ?? "Sin email"}</p>
            <p className="text-sm text-[var(--color-muted)]">
              payment_status: {row.paymentStatusLabel}
              {row.latestPaymentAttemptLabel ? ` · Último intento: ${row.latestPaymentAttemptLabel}` : ""}
            </p>
            <p className="text-sm text-[var(--color-muted)]">{buildOriginLabel(row)}</p>
          </div>
        </div>

        <div className="grid gap-2 md:min-w-[190px]">
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            Revisión manual
          </span>
          {row.participation ? (
            <>
              <form action={confirmParticipationAction}>
                <input type="hidden" name="participation_id" value={row.participation.id} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
                >
                  Confirmar pago
                </button>
              </form>
              <form action={rejectParticipationAction}>
                <input type="hidden" name="participation_id" value={row.participation.id} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
                >
                  Rechazar pago
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  let adminUser: Awaited<ReturnType<typeof requireAdminUser>> | null = null;

  try {
    adminUser = await withSupabaseTimeout(requireAdminUser(), "Supabase admin access check timed out");
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

  const params = searchParams ? await searchParams : undefined;
  const selectedProfileIds = parseSelectedProfileIds(params?.selected_profile_ids);
  const selectedTemplateOption = MANUAL_RECOVERY_TEMPLATE_OPTIONS.find((option) => option.key === params?.template_key);
  const selectedTemplateKey: ManualRecoveryTemplateKey = selectedTemplateOption?.key ?? getDefaultManualRecoveryTemplateKey();

  let adminNotice: string | null = null;
  let profiles: ProfileAdminRow[] = [];
  let participations: ParticipationAdminRow[] = [];
  let promoters: PromoterRefRow[] = [];
  let groups: GroupRefRow[] = [];
  let predictionCount = 0;
  let matchRows: MatchAdminRow[] = [];
  let paymentAttempts: PaymentAttemptAdminRow[] = [];
  let promotersSnapshot: Awaited<ReturnType<typeof getPromotersAdminSnapshot>> | null = null;

  try {
    const adminSupabase = createServiceRoleSupabaseClient();
    const adminResults = await withSupabaseTimeout(
      Promise.all([
        adminSupabase
          .from("profiles")
          .select("id, full_name, public_alias, email, whatsapp, created_at, avatar_url, avatar_seed, avatar_variant")
          .order("created_at", { ascending: false }),
        adminSupabase
          .from("participations")
          .select("id, profile_id, group_id, promoter_id, payment_status, entry_price, created_at, paid_at")
          .order("created_at", { ascending: false }),
        adminSupabase
          .from("payment_attempts")
          .select("id, participation_id, provider, status, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
        adminSupabase.from("promoters").select("id, name, code"),
        adminSupabase.from("groups").select("id, name"),
        adminSupabase.from("predictions").select("id", { count: "exact", head: true }),
        adminSupabase
          .from("matches")
          .select(
            `
              id,
              phase,
              round_name,
              stage,
              group_name,
              group_code,
              starts_at,
              status,
              score_home,
              score_away,
              home_team:teams!matches_home_team_id_fkey(code, fifa_code, name, short_name),
              away_team:teams!matches_away_team_id_fkey(code, fifa_code, name, short_name)
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
    paymentAttempts = (adminResults[2].data ?? []) as PaymentAttemptAdminRow[];
    promoters = (adminResults[3].data ?? []) as PromoterRefRow[];
    groups = (adminResults[4].data ?? []) as GroupRefRow[];
    predictionCount = adminResults[5].count ?? 0;
    matchRows = ((adminResults[6].data ?? []) as MatchQueryRow[]).map((match) => ({
      id: match.id,
      homeTeamName: resolveAdminTeamName(match.home_team, "Equipo local"),
      awayTeamName: resolveAdminTeamName(match.away_team, "Equipo visitante"),
      homeTeamCode: resolveAdminTeamCode(match.home_team, "LOC"),
      awayTeamCode: resolveAdminTeamCode(match.away_team, "VIS"),
      startsAt: match.starts_at,
      status: match.status,
      stage: match.stage ?? match.phase ?? null,
      roundName: match.round_name ?? null,
      groupCode: match.group_code ?? match.group_name ?? null,
      scoreHome: match.score_home,
      scoreAway: match.score_away,
    }));
    promotersSnapshot = adminResults[7];
  } catch {
    adminNotice =
      "No pudimos cargar el panel operativo completo. Reintentá en unos minutos o revisá la configuración del service role.";
  }

  const brevoStatus = getBrevoAdminStatus();
  const promoterMap = new Map(promoters.map((promoter) => [promoter.id, promoter]));
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const participationsByProfile = new Map<string, ParticipationAdminRow[]>();
  const paymentAttemptByParticipation = new Map<string, PaymentAttemptAdminRow>();

  for (const participation of participations) {
    const existing = participationsByProfile.get(participation.profile_id) ?? [];
    existing.push(participation);
    participationsByProfile.set(participation.profile_id, existing);
  }

  for (const attempt of paymentAttempts) {
    if (!paymentAttemptByParticipation.has(attempt.participation_id)) {
      paymentAttemptByParticipation.set(attempt.participation_id, attempt);
    }
  }

  const derivedRows = profiles.map<RegisteredWithoutPassRow>((profile) => {
    const participation =
      pickPrimaryParticipation(participationsByProfile.get(profile.id) ?? []).participation ?? null;
    const paymentState = resolveAdminPaymentState(participation?.payment_status);
    const promoter = participation?.promoter_id ? promoterMap.get(participation.promoter_id) ?? null : null;
    const group = participation?.group_id ? groupMap.get(participation.group_id) ?? null : null;
    const paymentAttempt = participation ? paymentAttemptByParticipation.get(participation.id) ?? null : null;

    return {
      profile,
      participation,
      promoterLabel: promoter ? `${promoter.name} (${promoter.code})` : null,
      groupLabel: group?.name ?? null,
      stateLabel: paymentState.label,
      paymentStatusLabel: formatPaymentStatusValue(participation?.payment_status),
      latestPaymentAttemptLabel: formatPaymentAttemptLabel(paymentAttempt),
      paymentAttempt,
      canCreateDraft: paymentState.canCreateDraft,
    };
  });

  const registeredCount = derivedRows.length;
  const activeRows = derivedRows.filter((row) => row.stateLabel === "Pase activo");
  const pendingRows = derivedRows.filter((row) => row.stateLabel === "Pago pendiente");
  const manualReviewRows = derivedRows.filter((row) => row.stateLabel === "Revisión manual");
  const withoutPassRows = derivedRows.filter((row) => row.canCreateDraft);
  const confirmedRevenue = activeRows.reduce(
    (sum, row) => sum + resolveNumericAmount(row.participation?.entry_price ?? null),
    0,
  );
  const conversionRate = registeredCount > 0 ? Math.round((activeRows.length / registeredCount) * 100) : 0;
  const previewTemplates = Object.fromEntries(
    MANUAL_RECOVERY_TEMPLATE_OPTIONS.map((option) => [
      option.key,
      buildManualRecoveryTemplateContent(option.key, MANUAL_RECOVERY_PREVIEW_RECIPIENT),
    ]),
  ) as Record<ManualRecoveryTemplateKey, ReturnType<typeof buildManualRecoveryTemplateContent>>;

  return (
    <PageStack>
      <PageHero
        title="Admin"
        description="Operación mínima para activar jugadores, revisar pagos y sostener la recaudación real del torneo."
        tone="stadium"
      />

      {adminNotice ? <InfoNotice tone="error" message={adminNotice} /> : null}
      {params?.send_notice ? <InfoNotice tone="info" message={params.send_notice} /> : null}
      {params?.send_error ? <InfoNotice tone="error" message={params.send_error} /> : null}
      {params?.ranking_notice ? <InfoNotice tone="info" message={params.ranking_notice} /> : null}
      {params?.test_notice ? <InfoNotice tone="info" message={params.test_notice} /> : null}
      {params?.test_error ? <InfoNotice tone="error" message={params.test_error} /> : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Registrados" value={String(registeredCount)} detail="Perfiles creados" />
        <StatCard label="Sin Pase" value={String(withoutPassRows.length)} detail="Estados reintentables" />
        <StatCard label="Pagos pendientes" value={String(pendingRows.length)} detail="Checkout iniciado o pendiente" />
        <StatCard label="Revisión manual" value={String(manualReviewRows.length)} detail="Separados del envío manual" />
        <StatCard label="Jugadores activos" value={String(activeRows.length)} detail="payment_status = paid" />
        <StatCard label="Conversión" value={`${conversionRate}%`} detail="Registro → Pase activo" />
        <StatCard label="Recaudado" value={formatEntryPrice(confirmedRevenue)} detail="Solo participations paid" />
      </section>

      <ManualRecoveryPanel
        adminEmail={adminUser?.user.email ?? null}
        brevoStatus={brevoStatus}
        rows={withoutPassRows as ManualRecoveryPanelRow[]}
        previewTemplates={previewTemplates}
        initialSelectedProfileIds={selectedProfileIds}
        initialTemplateKey={selectedTemplateKey}
        initialTestContext={params?.test_context ?? null}
        initialTestProof={params?.test_proof ?? null}
        sendRealAction={sendBrevoRecoveryEmailsAction}
        sendTestAction={sendBrevoRecoveryTestAction}
        confirmParticipationAction={confirmParticipationAction}
        rejectParticipationAction={rejectParticipationAction}
      />

      {manualReviewRows.length > 0 ? (
        <SurfaceCard
          title="Revisión manual"
          description="Estos casos quedan separados del flujo de borradores y requieren resolución admin."
        >
          <div className="grid gap-4">
            {manualReviewRows.map((row) => (
              <ManualReviewRow key={row.profile.id} row={row} />
            ))}
          </div>
        </SurfaceCard>
      ) : null}

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Si ya hay resultados oficiales cargados, podés re-scorear los partidos finalizados y reconstruir el ranking general sin tocar KO, especiales ni mediana.
          </p>
          <form action={rebuildRankingsAction}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
            >
              Recalcular ranking
            </button>
          </form>
        </div>
        {matchRows.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Todavía no hay partidos cargados para operar.
          </p>
        ) : (
          <div className="grid gap-4">
            {matchRows.map((match) => {
              return (
                <div
                  key={match.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="grid gap-1">
                      <p className="font-serif text-[1.35rem] font-bold uppercase text-[var(--color-primary)]">
                        {match.homeTeamName} vs {match.awayTeamName}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {formatAdminMatchMeta(match)}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Estado actual: {formatAdminMatchStatus(match.status)}
                        {match.scoreHome !== null && match.scoreAway !== null
                          ? ` · ${match.scoreHome} - ${match.scoreAway}`
                          : ""}
                      </p>
                    </div>

                    <form action={publishMatchResultAction} className="grid gap-3 sm:min-w-[260px]">
                      <input type="hidden" name="match_id" value={match.id} />
                      <div className="grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                            {match.homeTeamCode}
                          </span>
                          <input
                            name="score_home"
                            type="number"
                            min="0"
                            defaultValue={match.scoreHome ?? 0}
                            className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
                          />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                            {match.awayTeamCode}
                          </span>
                          <input
                            name="score_away"
                            type="number"
                            min="0"
                            defaultValue={match.scoreAway ?? 0}
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
        description="Con esta base ya podés seguir la conversión real, confirmar jugadores y operar recuperación manual con drafts o tandas controladas."
      >
        <div className="grid gap-3 text-sm leading-6 text-[var(--color-muted)]">
          <p>1. El jugador entra o se loguea y va directo a `/activar-pase`.</p>
          <p>2. Checkout Pro crea o reutiliza el intento trazable en `payment_attempts`.</p>
          <p>3. El webhook o la verificación server-side actualizan `participations.payment_status`.</p>
          <p>4. Si queda en estado reintentable, Admin puede enviar una tanda Brevo de hasta 40 correos.</p>
          <p>5. `manual_review` queda separado para resolución admin antes de cualquier contacto.</p>
          <p>6. Hoy hay {predictionCount.toLocaleString("es-AR")} pronóstico(s) cargado(s) en total.</p>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
