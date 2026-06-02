import Link from "next/link";
import { createGroupAction, joinGroupAction } from "@/app/groups/actions";
import { PageHero } from "@/components/page-hero";
import {
  InfoNotice,
  PageStack,
  RankedRow,
  StatCard,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import {
  getGroupCompetitionSnapshot,
  normalizeInviteCode,
  type GroupLeaderboardEntry,
  type GroupMemberSnapshot,
} from "@/lib/groups/competition";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

type GroupsPageProps = {
  searchParams?: Promise<{
    code?: string;
    error?: string;
    notice?: string;
  }>;
};

function formatAveragePoints(points: number) {
  return `${points.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} pts`;
}

function formatMemberPoints(points: number) {
  return `${points.toLocaleString("es-AR")} pts`;
}

function buildGroupMeta(member: GroupMemberSnapshot) {
  const parts = [];

  if (member.isActive && member.groupPosition) {
    parts.push(`Puesto ${member.groupPosition}`);
  } else if (member.isActive) {
    parts.push("Activo");
  } else {
    parts.push("Pendiente");
  }

  if (member.generalPosition) {
    parts.push(`General #${member.generalPosition}`);
  }

  return parts.join(" • ");
}

function GroupStatusBadge({ entry }: { entry: GroupLeaderboardEntry }) {
  const className =
    entry.status === "enabled"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[var(--color-muted)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${className}`}>
      {entry.status === "enabled" ? "Habilitado" : "Preview"}
    </span>
  );
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const prefilledCode = normalizeInviteCode(params?.code ?? "");
  const errorMessage = params?.error ?? null;
  const noticeMessage = params?.notice ?? null;

  let userId: string | null = null;
  let authErrorMessage: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    userId = user?.id ?? null;
  } catch {
    authErrorMessage =
      "No pudimos revisar tu sesión ahora. Si venías a crear o unirte a un grupo, reintentá en unos minutos.";
  }

  if (!userId) {
    return (
      <PageStack>
        <PageHero
          title="Grupos."
          description="Acá vive la competencia corta: armás tu equipo, sumás activos y peleás el promedio contra otros grupos."
          tone="stadium"
        />

        {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}

        <SurfaceCard
          title="Entrá para competir en grupo"
          description="Necesitás sesión para crear grupo, entrar con código y dejar definido tu grupo principal."
        >
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              El grupo suma otra capa de competencia: ranking interno, DT del grupo y tabla de promedios.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?next=/groups"
                className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
              >
                Entrar y competir
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </SurfaceCard>
      </PageStack>
    );
  }

  let groupErrorMessage: string | null = null;
  let snapshot = null;

  try {
    snapshot = await getGroupCompetitionSnapshot(userId);
  } catch {
    groupErrorMessage =
      "No pudimos cargar la competencia por grupos ahora. Reintentá en unos minutos.";
  }

  const currentGroup = snapshot?.currentGroup ?? null;
  const leaderboard = snapshot?.leaderboard ?? [];
  const currentParticipationStatus = snapshot?.currentParticipationStatus ?? null;
  const currentUserAlias = snapshot?.currentUserAlias ?? "Vos";
  const dtLabel = currentGroup?.dtAlias ?? "Todavía no hay DT";
  const inviteLinkPath = currentGroup?.inviteCode ? `/groups?code=${currentGroup.inviteCode}` : null;

  return (
    <PageStack>
      <PageHero
        eyebrow="Competencia social"
        title="Grupos."
        description="Definí tu grupo principal, sumá activos y peleá otra tabla además del ranking general."
        tone="stadium"
      />

      {authErrorMessage ? <InfoNotice message={authErrorMessage} tone="error" /> : null}
      {errorMessage ? <InfoNotice message={errorMessage} tone="error" /> : null}
      {noticeMessage ? <InfoNotice message={noticeMessage} tone="info" /> : null}
      {groupErrorMessage ? <InfoNotice message={groupErrorMessage} tone="error" /> : null}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard
          title={currentGroup ? currentGroup.name : "Todavía no tenés grupo"}
          description={
            currentGroup
              ? "Ese grupo ya quedó marcado como tu grupo principal dentro del torneo."
              : "Podés crear uno propio o entrar con código. En este MVP solo competís con un grupo a la vez."
          }
        >
          {currentGroup ? (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <GroupStatusBadge entry={currentGroup} />
                <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  {currentGroup.activeCount}/11 activos
                </span>
                <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                  {currentGroup.totalCount} miembros
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="DT del grupo"
                  value={dtLabel}
                  detail="Es el jugador activo con más puntos dentro del grupo."
                />
                <StatCard
                  label="Promedio"
                  value={formatAveragePoints(currentGroup.averagePoints)}
                  detail="Se calcula solo con jugadores activos/pagos."
                />
                <StatCard
                  label="Puesto"
                  value={`#${currentGroup.position}`}
                  detail={
                    currentGroup.isEligible
                      ? "Tu grupo ya entra en la tabla oficial de grupos."
                      : "Sigue en preview hasta llegar a 11 activos."
                  }
                />
              </div>

              <div className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                      Código de ingreso
                    </p>
                    <p className="mt-1 font-serif text-[1.8rem] font-bold uppercase text-[var(--color-primary)]">
                      {currentGroup.inviteCode ?? "Sin código"}
                    </p>
                  </div>
                  {inviteLinkPath ? (
                    <div className="max-w-[17rem] text-right text-sm leading-6 text-[var(--color-muted)]">
                      Link corto:
                      <br />
                      <span className="font-semibold text-[var(--color-ink)]">{inviteLinkPath}</span>
                    </div>
                  ) : null}
                </div>
                <p className="text-sm leading-6 text-[var(--color-muted)]">
                  Compartí ese código o el link corto para sumar jugadores. Si entrás a otro grupo, ese nuevo grupo pasa a ser tu principal.
                </p>
              </div>

              {currentParticipationStatus !== "paid" ? (
                <InfoNotice
                  message="Ya podés estar en un grupo, pero solo vas a contar para el ranking interno y la regla de 11 cuando tu participación quede activa."
                  tone="info"
                />
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4">
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                Tu grupo principal todavía está vacío. Crealo ahora o pegá un código para entrar al equipo de alguien más.
              </p>
              {currentParticipationStatus !== "paid" ? (
                <InfoNotice
                  message="Podés definir tu grupo antes de pagar. Cuando actives tu participación, recién empezás a sumar para el ranking oficial del grupo."
                  tone="info"
                />
              ) : null}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard
          title={currentGroup ? "Cambiar o sumar grupo" : "Crear o unirte"}
          description="En este MVP, el último grupo que elijas pasa a ser tu grupo principal."
        >
          <div className="grid gap-4">
            <form action={createGroupAction} className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
              <label
                htmlFor="group_name"
                className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]"
              >
                Crear grupo
              </label>
              <input
                id="group_name"
                name="group_name"
                type="text"
                required
                minLength={3}
                className="min-h-14 rounded-xl border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-strong)]"
                placeholder="Ej: La banda del barrio"
              />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
              >
                Crear grupo
              </button>
            </form>

            <form action={joinGroupAction} className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
              <label
                htmlFor="invite_code"
                className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]"
              >
                Unirte con código o link
              </label>
              <input
                id="invite_code"
                name="invite_code"
                type="text"
                required
                defaultValue={prefilledCode}
                className="min-h-14 rounded-xl border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-base uppercase tracking-[0.08em] text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-strong)]"
                placeholder="Ej: RIVER26"
              />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-primary)] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white"
              >
                Unirme al grupo
              </button>
            </form>
          </div>
        </SurfaceCard>
      </section>

      <SurfaceCard
        title="Ranking interno"
        description="Solo entran jugadores activos/pagos. Los pendientes siguen visibles para que el grupo se arme, pero no suman todavía."
      >
        {!currentGroup ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Cuando definas tu grupo principal, acá vas a ver la tabla interna y quién quedó como DT.
          </p>
        ) : currentGroup.members.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Ese grupo todavía no tiene miembros visibles.
          </p>
        ) : (
          <div className="grid gap-3">
            {currentGroup.members.map((member) => {
              const tags = [];

              if (member.profileId === currentGroup.dtProfileId && member.isActive) {
                tags.push("DT");
              }

              if (member.isCurrentUser) {
                tags.push("Vos");
              }

              if (!member.isActive) {
                tags.push("Pendiente");
              }

              return (
                <div
                  key={member.profileId}
                  className={[
                    "rounded-lg border border-[var(--color-line)]",
                    member.isCurrentUser ? "bg-[rgba(154,225,255,0.18)]" : "bg-[var(--color-surface)]",
                  ].join(" ")}
                >
                  <RankedRow
                    name={member.alias}
                    meta={buildGroupMeta(member)}
                    points={member.isActive ? formatMemberPoints(member.points) : "--"}
                    highlight={member.isCurrentUser}
                  />
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 px-4 pb-4">
                      {tags.map((tag) => (
                        <span
                          key={`${member.profileId}-${tag}`}
                          className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {currentGroup.activeCount < 2 ? (
              <InfoNotice
                message="El grupo está en formación. Apenas haya dos activos o más, la tabla interna ya sirve para compararse."
                tone="info"
              />
            ) : null}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard
        title="Ranking de grupos"
        description="Ordena por promedio de puntos oficiales del grupo. La elegibilidad real recién se activa con 11 jugadores pagos."
      >
        {leaderboard.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Todavía no hay grupos para comparar. El primero que se arme va a inaugurar esta tabla.
          </p>
        ) : (
          <div className="grid gap-3">
            {leaderboard.map((entry) => {
              const isCurrentGroup = currentGroup?.groupId === entry.groupId;

              return (
                <div
                  key={entry.groupId}
                  className={[
                    "rounded-lg border border-[var(--color-line)] p-4",
                    isCurrentGroup ? "bg-[rgba(154,225,255,0.18)]" : "bg-[var(--color-surface)]",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                          #{entry.position}
                        </span>
                        <p className="font-serif text-[1.45rem] font-bold uppercase text-[var(--color-primary)]">
                          {entry.name}
                        </p>
                        <GroupStatusBadge entry={entry} />
                      </div>
                      <p className="text-sm leading-6 text-[var(--color-muted)]">
                        DT del grupo:{" "}
                        <span className="font-semibold text-[var(--color-ink)]">
                          {entry.dtAlias ?? "Todavía no hay DT"}
                        </span>
                      </p>
                      <p className="text-sm leading-6 text-[var(--color-muted)]">
                        {entry.activeCount} activos / {entry.totalCount} miembros
                        {isCurrentGroup ? ` • ${currentUserAlias} compite acá` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                        Promedio oficial
                      </p>
                      <p className="mt-1 font-serif text-[1.9rem] font-bold uppercase text-[var(--color-primary)]">
                        {formatAveragePoints(entry.averagePoints)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SurfaceCard>
    </PageStack>
  );
}
