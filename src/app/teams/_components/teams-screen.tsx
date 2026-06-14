import Link from "next/link";
import { claimTeamPassInviteAction, createGroupAction, joinGroupAction } from "@/app/groups/actions";
import type { CaptainBonusState, TeamInviteContext, TeamPassInviteContext } from "@/app/teams/_page-state";
import type { TeamsScreenData } from "@/app/teams/_screen-data";
import type { TeamMember } from "@/app/teams/_mock";
import { RankingIcon, SoccerBallIcon, TrophyIcon } from "@/components/app-icons";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { TeamInviteActions } from "@/app/teams/_components/team-invite-actions";
import { TeamInviteJoinPanel } from "@/app/teams/_components/team-invite-join-panel";
import { GroupAvatarPanel } from "@/app/teams/_components/group-avatar-panel";
import { TeamPassPanel } from "@/app/teams/_components/team-pass-panel";
import type { TeamPassSummary } from "@/lib/team-passes/contracts";

type TeamsScreenProps = {
  authStatus: "guest" | "member";
  hasCurrentTeam: boolean;
  currentAlias: string | null;
  currentParticipationStatus: string | null;
  data: TeamsScreenData;
  inviteContext: TeamInviteContext | null;
  teamPassInviteContext: TeamPassInviteContext | null;
  teamPassSummary: TeamPassSummary | null;
  captainBonusState: CaptainBonusState | null;
  inviteCodePrefill?: string;
  teamPassCodePrefill?: string;
  errorMessage?: string | null;
  noticeMessage?: string | null;
  prizePoolLabel: string;
  routeBase?: "/groups" | "/teams";
};

function formatPoints(points: number) {
  return `${points.toLocaleString("es-AR")} pts`;
}

function memberTag(member: TeamMember) {
  const tags: string[] = [];

  if (member.isCaptain || member.status === "captain") {
    tags.push("Capitán");
  }

  if (member.isDt || member.status === "dt") {
    tags.push("DT");
  }

  if (tags.length > 0) {
    return tags.join(" · ");
  }

  if (member.status === "bench") {
    return "Banco";
  }

  if (member.status === "registered") {
    return "Registrado";
  }

  return "Jugador activo";
}

function EmptyPanel({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div className="teams-empty-panel">
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}

function TeamAccessPanel({
  authStatus,
  hasCurrentTeam,
  currentParticipationStatus,
  routeBase,
  loginReturnPath,
  inviteCodePrefill,
  teamPassInviteContext,
  inviteContext,
  captainBonusState,
  noticeMessage,
  prizePoolLabel,
  errorMessage,
  inviteCode,
  teamPassCodePrefill,
  teamName,
}: {
  authStatus: "guest" | "member";
  hasCurrentTeam: boolean;
  currentParticipationStatus: string | null;
  routeBase: "/groups" | "/teams";
  loginReturnPath: string;
  inviteCodePrefill: string;
  teamPassInviteContext: TeamPassInviteContext | null;
  inviteContext: TeamInviteContext | null;
  captainBonusState: CaptainBonusState | null;
  noticeMessage: string | null | undefined;
  prizePoolLabel: string;
  errorMessage: string | null | undefined;
  inviteCode: string | null;
  teamPassCodePrefill: string;
  teamName: string;
}) {
  const canUseTeamFlow = currentParticipationStatus === "paid" || currentParticipationStatus === "granted";

  if (authStatus === "guest") {
    return (
      <article className="teams-support-card teams-support-card-cta">
        <div className="teams-support-header">
          <span className="teams-chip teams-chip-outline">Team</span>
          <TrophyIcon className="h-5 w-5 text-[var(--color-gold)]" />
        </div>
        <h2 className="teams-support-title">Entrá para armar tu Team y salir a buscar La Gloria.</h2>
        <p className="teams-support-copy">
          El Capitán arma el Team. El DT se gana el puesto sumando puntos.
        </p>
        {inviteContext?.status === "ready" && inviteContext.targetGroupName ? (
          <p className="teams-support-copy">
            Ya tenés un lugar en {inviteContext.targetGroupName}. Ingresá y te sumamos al Plantel.
          </p>
        ) : null}
        <div className="teams-cta-stack">
          <Link href={`/login?next=${encodeURIComponent(loginReturnPath)}`} className="teams-button-primary">
            Ingresar
          </Link>
          <Link href={`/register?next=${encodeURIComponent(loginReturnPath)}`} className="teams-button-secondary">
            Crear cuenta
          </Link>
        </div>
      </article>
    );
  }

  if (teamPassInviteContext?.status === "ready") {
    return (
      <article className="teams-support-card teams-support-card-ops">
        <div className="teams-support-header">
          <span className="teams-chip teams-chip-gold">Cupo prepago</span>
          <span className="teams-inline-meta">Listo para activar</span>
        </div>
        <h2 className="teams-support-title">Ya tenés un lugar pago en {teamPassInviteContext.targetGroupName ?? "este Team"}.</h2>
        <p className="teams-support-copy">
          Este cupo no crea un bot ni un jugador automático. Lo activás con tu cuenta real y entrás al Team al instante.
        </p>
        <form action={claimTeamPassInviteAction} className="grid gap-3">
          <input type="hidden" name="return_to" value={loginReturnPath} />
          <input type="hidden" name="team_pass_code" value={teamPassCodePrefill} />
          <button type="submit" className="teams-button-primary">
            Activar mi cupo prepago
          </button>
        </form>
      </article>
    );
  }

  if (teamPassInviteContext?.status === "claimed") {
    return (
      <article className="teams-support-card teams-support-card-ops">
        <div className="teams-support-header">
          <span className="teams-chip teams-chip-outline">Cupo prepago</span>
          <span className="teams-inline-meta">Ya reclamado</span>
        </div>
        <h2 className="teams-support-title">Ese cupo prepago ya fue usado.</h2>
        <p className="teams-support-copy">
          Si todavía querés entrar a {teamPassInviteContext.targetGroupName ?? "ese Team"}, pedile al Capitán un nuevo link o usá el código abierto del Team.
        </p>
      </article>
    );
  }

  if (teamPassInviteContext?.status === "expired" || teamPassInviteContext?.status === "missing") {
    return (
      <article className="teams-support-card teams-support-card-ops">
        <div className="teams-support-header">
          <span className="teams-chip teams-chip-outline">Cupo prepago</span>
          <span className="teams-inline-meta">No disponible</span>
        </div>
        <h2 className="teams-support-title">Ese cupo prepago ya no está disponible.</h2>
        <p className="teams-support-copy">
          Pedile al Capitán un nuevo link o activá tu Pase Solidario por el flujo normal.
        </p>
        <Link href="/activar-pase" className="teams-button-primary">
          Activar mi Pase
        </Link>
      </article>
    );
  }

  if (teamPassInviteContext?.status === "already-paid") {
    return (
      <article className="teams-support-card teams-support-card-ops">
        <div className="teams-support-header">
          <span className="teams-chip teams-chip-outline">Cupo prepago</span>
          <span className="teams-inline-meta">Tu Pase ya está activo</span>
        </div>
        <h2 className="teams-support-title">Tu cuenta ya compite con un Pase activo.</h2>
        <p className="teams-support-copy">
          No hace falta reclamar este cupo. Si querés entrar al Team, usá el código o link normal del Capitán.
        </p>
      </article>
    );
  }

  if (!canUseTeamFlow) {
    return (
      <article className="teams-support-card teams-support-card-ops">
        <div className="teams-support-header">
          <span className="teams-chip teams-chip-outline">Pase Solidario</span>
          <span className="teams-inline-meta">Activación requerida</span>
        </div>
        <h2 className="teams-support-title">Activá tu Pase para crear o sumarte a un Team.</h2>
        <p className="teams-support-copy">
          Con el Pase Solidario activo ya podés entrar al Plantel, armar tu Team y competir por La Gloria.
        </p>
        <Link href="/activar-pase" className="teams-button-primary">
          Activar mi Pase
        </Link>
      </article>
    );
  }

  return (
    <article className="teams-support-card teams-support-card-ops">
      <div className="teams-support-header">
        <span className="teams-chip teams-chip-outline">Team</span>
        <span className="teams-inline-meta">
          {hasCurrentTeam ? "Panel competitivo activo" : "Creá o unite por código"}
        </span>
      </div>

      {noticeMessage ? <div className="teams-alert teams-alert-success">{noticeMessage}</div> : null}
      {errorMessage ? <div className="teams-alert teams-alert-error">{errorMessage}</div> : null}

      {inviteContext ? (
        <TeamInviteJoinPanel
          authStatus={authStatus}
          inviteContext={inviteContext}
          returnPath={loginReturnPath}
        />
      ) : null}

      {captainBonusState ? (
        <div className="rounded-xl border border-[#d9c46f] bg-[#fff9df] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
            Pase Capitán Bonificado
          </p>
          {captainBonusState.status === "completed" ? (
            <>
              <h3 className="mt-2 font-serif text-[1.55rem] font-bold uppercase leading-none text-[var(--color-ink)]">
                Objetivo cumplido
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Tu Team ya tiene {captainBonusState.requiredMembers} integrantes activos. Ya estás habilitado para competir por premios.
              </p>
            </>
          ) : captainBonusState.status === "expired" ? (
            <>
              <h3 className="mt-2 font-serif text-[1.55rem] font-bold uppercase leading-none text-[var(--color-ink)]">
                El plazo para habilitar premios terminó
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Podés seguir jugando y aparecer en el ranking general, pero este Team no participa por premios.
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-2 font-serif text-[1.55rem] font-bold uppercase leading-none text-[var(--color-ink)]">
                Tu pase está activo, pero todavía no estás habilitado para premios.
              </h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                Progreso del Team:
              </p>
              <p className="font-serif text-[2rem] font-bold leading-none text-[var(--color-primary)]">
                {captainBonusState.activeMembers} / {captainBonusState.requiredMembers} integrantes activos
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                Te faltan {captainBonusState.missingMembers} jugadores antes del {captainBonusState.deadlineLabel}.
              </p>
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                Mientras antes entren, antes empiezan a sumar para el equipo.
              </p>
            </>
          )}
        </div>
      ) : null}

      {hasCurrentTeam && inviteCode ? (
        <div className="teams-invite-box">
          <h3 className="teams-invite-title">Invitá jugadores al Team</h3>
          <p className="teams-support-copy">
            Sumá gente al Plantel. Entran todos. Puntúan los mejores 11.
          </p>
          <TeamInviteActions
            inviteCode={inviteCode}
            prizePoolLabel={prizePoolLabel}
            teamName={captainBonusState?.teamName ?? teamName}
            variant={captainBonusState ? "captain-bonus" : "default"}
          />
        </div>
      ) : null}

      {!hasCurrentTeam && !inviteContext?.shouldAutoJoin ? (
        <div className="teams-ops-stack">
          <form action={createGroupAction} className="teams-form">
            <input type="hidden" name="return_to" value={routeBase} />
            <label className="teams-form-label" htmlFor="group_name">
              Nombre del Team
            </label>
            <input
              id="group_name"
              name="group_name"
              className="teams-input"
              placeholder="Ej: La Banda del Barrio"
              minLength={3}
              maxLength={48}
              required
            />
            <button type="submit" className="teams-button-primary">
              Crear Team
            </button>
          </form>

          <form action={joinGroupAction} className="teams-form">
            <input type="hidden" name="return_to" value={loginReturnPath} />
            <label className="teams-form-label" htmlFor="invite_code">
              Código o link de invitación
            </label>
            <input
              id="invite_code"
              name="invite_code"
              defaultValue={inviteCodePrefill}
              className="teams-input"
              placeholder="Pegá el Código del Team o link"
              autoCapitalize="characters"
              required
            />
            <button type="submit" className="teams-button-secondary">
              Unirme a un Team
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

export function TeamsScreen({
  authStatus,
  hasCurrentTeam,
  currentAlias,
  currentParticipationStatus,
  data,
  inviteContext,
  teamPassInviteContext,
  teamPassSummary,
  captainBonusState,
  inviteCodePrefill = "",
  teamPassCodePrefill = "",
  errorMessage,
  noticeMessage,
  prizePoolLabel,
  routeBase = "/groups",
}: TeamsScreenProps) {
  const rosterCount = data.starters.length + data.bench.length + data.registered.length;
  const participationLabel =
    currentParticipationStatus === "paid"
      ? "Aporte confirmado"
      : currentParticipationStatus === "granted"
        ? "Pase Capitán Bonificado"
        : "Pendiente de activar";
  const hasRanking = data.ranking.length > 0;
  const loginReturnPath = inviteContext?.code
    ? `/groups?code=${inviteContext.code}`
    : teamPassInviteContext?.code
      ? `/groups?slot=${teamPassInviteContext.code}`
      : routeBase;

  return (
    <div className="teams-screen">
      <section className="teams-hero-grid">
        <article className="teams-score-card">
          <div className="teams-score-copy">
            <span className="teams-chip teams-chip-secondary">{data.statusLabel}</span>
            <div className="teams-score-title-row">
              <GroupAvatarPanel
                canEdit={Boolean(data.canEditAvatar && data.groupId)}
                currentAvatarChoice={data.currentAvatarChoice ?? "auto"}
                fallbackAvatarUrl={data.groupFallbackAvatarUrl ?? null}
                groupId={data.groupId ?? ""}
                label={data.teamName}
                seed={data.groupAvatarSeed ?? data.teamName}
                url={data.groupAvatarUrl ?? null}
                variant={data.groupAvatarVariant ?? null}
              />
              <h1 className="teams-score-title">{data.teamName}</h1>
            </div>
            <p className="teams-score-subtitle">{data.headline}</p>
            <p className="teams-score-note">{data.supportCopy}</p>
            {currentAlias ? (
              <p className="teams-score-note">
                Jugás como <strong>{currentAlias}</strong>. Estado actual:{" "}
                <strong>{participationLabel}</strong>.
              </p>
            ) : null}
          </div>

          <div className="teams-score-aside">
            <p className="teams-kicker">Team score</p>
            <p className="teams-score-value">{data.teamScore.toLocaleString("es-AR")}</p>
            <p className="teams-score-detail">Suma de puntos de los mejores 11 activos.</p>
          </div>

          <div className="teams-card-accent">
            <div className="teams-captain-card">
              <PlayerAvatar
                fallbackImageUrl={data.captain.fallbackAvatarUrl}
                imageUrl={data.captain.avatarUrl}
                label={`${data.captain.name} ${data.captain.alias}`}
                seed={data.captain.avatarSeed}
                size="md"
                variant={data.captain.avatarVariant}
              />
              <div>
                <p className="teams-kicker">Capitán</p>
                <p className="teams-card-title">{data.captain.name}</p>
                <p className="teams-card-alias">{data.captain.alias}</p>
                <p className="teams-card-copy">{data.captain.detail}</p>
              </div>
            </div>
          </div>

          <div className="teams-card-ornament" aria-hidden="true">
            <SoccerBallIcon className="h-40 w-40" />
          </div>
        </article>

        <aside className="teams-support-column">
          <article className="teams-support-card">
            <div className="teams-support-badge">
              <PlayerAvatar
                fallbackImageUrl={data.dt.fallbackAvatarUrl}
                imageUrl={data.dt.avatarUrl}
                label={data.dt.name}
                seed={data.dt.avatarSeed}
                size="lg"
                variant={data.dt.avatarVariant}
              />
              <span className="teams-chip teams-chip-gold">{data.dt.badge}</span>
            </div>

            <h2 className="teams-support-title">{data.dt.name}</h2>
            <p className="teams-support-copy">{data.dt.detail}</p>

            <div className="teams-stat-box">
              <p className="teams-kicker">
                {data.dt.badge.includes("Capitán") ? "Capitán y DT" : "Jugador activo"}
              </p>
              <p className="teams-stat-value">{formatPoints(data.dt.points)}</p>
              <p className="teams-stat-caption">El DT se gana el puesto sumando puntos.</p>
            </div>
          </article>

          <TeamAccessPanel
            authStatus={authStatus}
            hasCurrentTeam={hasCurrentTeam}
            currentParticipationStatus={currentParticipationStatus}
            routeBase={routeBase}
            loginReturnPath={loginReturnPath}
            inviteCodePrefill={inviteCodePrefill}
            teamPassCodePrefill={teamPassCodePrefill}
            teamPassInviteContext={teamPassInviteContext}
            inviteContext={inviteContext}
            captainBonusState={captainBonusState}
            noticeMessage={noticeMessage}
            prizePoolLabel={prizePoolLabel}
            errorMessage={errorMessage}
            inviteCode={data.inviteCode}
            teamName={data.teamName}
          />
        </aside>
      </section>

      <section className="teams-summary-grid">
        <article className="teams-summary-card">
          <p className="teams-kicker">Plantel</p>
          <p className="teams-summary-value">{rosterCount}</p>
          <p className="teams-summary-copy">Entran todos al Team.</p>
        </article>
        <article className="teams-summary-card">
          <p className="teams-kicker">11 titular</p>
          <p className="teams-summary-value">{data.starters.length}</p>
          <p className="teams-summary-copy">Puntúan los mejores 11.</p>
        </article>
        <article className="teams-summary-card">
          <p className="teams-kicker">Banco</p>
          <p className="teams-summary-value">{data.bench.length}</p>
          <p className="teams-summary-copy">Activos fuera del top 11.</p>
        </article>
        <article className="teams-summary-card">
          <p className="teams-kicker">Registrados</p>
          <p className="teams-summary-value">{data.registered.length}</p>
          <p className="teams-summary-copy">No suman sin Aporte confirmado.</p>
        </article>
      </section>

      {hasCurrentTeam && (
        <TeamPassPanel
          canManage={Boolean(data.canEditAvatar && data.groupId)}
          teamId={data.groupId ?? null}
          summary={teamPassSummary}
        />
      )}

      <section className="teams-content-grid">
        <div className="teams-main-column">
          <article className="teams-panel">
            <div className="teams-panel-header">
              <div>
                <h2 className="teams-panel-title">11 titular</h2>
                <p className="teams-panel-copy">
                  Jugadores activos que hoy sostienen el Team score.
                </p>
              </div>
              <span className="teams-panel-meta">{data.contributionLabel}</span>
            </div>

            {data.starters.length > 0 ? (
              <div className="teams-table">
                {data.starters.map((member, index) => (
                  <div className="teams-table-row" key={member.id}>
                    <div className="teams-rank-pill">{index + 1}</div>
                    <div className="teams-table-player">
                      <PlayerAvatar
                        fallbackImageUrl={member.fallbackAvatarUrl}
                        imageUrl={member.avatarUrl}
                        label={member.name}
                        seed={member.avatarSeed}
                        size="sm"
                        variant={member.avatarVariant}
                      />
                      <div>
                        <p className="teams-table-name">{member.name}</p>
                        <p className="teams-table-role">{member.roleLabel}</p>
                      </div>
                    </div>
                    <div className="teams-table-status">
                      <span className="teams-chip teams-chip-soft">{memberTag(member)}</span>
                      {member.note ? <p className="teams-table-note">{member.note}</p> : null}
                    </div>
                    <div className="teams-table-points">{formatPoints(member.points)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="Todavía no hay 11 titular"
                copy="Cuando el Plantel tenga Jugadores activos, los mejores 11 van a entrar acá."
              />
            )}
          </article>

          <article className="teams-panel">
            <div className="teams-panel-header">
              <div>
                <h2 className="teams-panel-title">Banco</h2>
                <p className="teams-panel-copy">
                  Jugadores activos fuera del top 11 que pueden meterse sumando puntos.
                </p>
              </div>
            </div>

            {data.bench.length > 0 ? (
              <div className="teams-bench-grid">
                {data.bench.map((member) => (
                  <div className="teams-bench-card" key={member.id}>
                    <div className="teams-bench-head">
                      <PlayerAvatar
                        fallbackImageUrl={member.fallbackAvatarUrl}
                        imageUrl={member.avatarUrl}
                        label={member.name}
                        seed={member.avatarSeed}
                        size="md"
                        variant={member.avatarVariant}
                      />
                      <div>
                        <p className="teams-table-name">{member.name}</p>
                        <p className="teams-table-role">{member.roleLabel}</p>
                      </div>
                    </div>
                    <div className="teams-bench-foot">
                      <span className="teams-chip teams-chip-outline">{memberTag(member)}</span>
                      <strong>{formatPoints(member.points)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="Sin Banco por ahora"
                copy="Cuando tengas más de 11 Jugadores activos, el resto va a competir desde acá."
              />
            )}
          </article>

          <article className="teams-panel teams-panel-muted">
            <div className="teams-panel-header">
              <div>
                <h2 className="teams-panel-title">Plantel</h2>
                <p className="teams-panel-copy">
                  Los Registrados entran al Plantel, pero no suman hasta tener Aporte confirmado.
                </p>
              </div>
            </div>

            {data.registered.length > 0 ? (
              <div className="teams-roster-list">
                {data.registered.map((member) => (
                  <div className="teams-roster-chip" key={member.id}>
                    <PlayerAvatar
                      fallbackImageUrl={member.fallbackAvatarUrl}
                      imageUrl={member.avatarUrl}
                      label={member.name}
                      seed={member.avatarSeed}
                      size="sm"
                      variant={member.avatarVariant}
                    />
                    <span>{member.name}</span>
                    <em>{member.note}</em>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="Plantel listo para crecer"
                copy="Compartí el link o el Código del Team para sumar más gente al Plantel."
              />
            )}
          </article>
        </div>

        <aside className="teams-side-column">
          <article className="teams-panel teams-ranking-panel">
            <div className="teams-ranking-header">
              <h2 className="teams-panel-title">
                <RankingIcon className="h-5 w-5" /> Ranking de Teams
              </h2>
              <p className="teams-panel-copy">
                La tabla premia a los Teams que mejor arman su 11 titular.
              </p>
            </div>

            <div className="teams-ranking-list">
              {hasRanking ? (
                data.ranking.map((entry) => (
                  <div
                    className={
                      entry.isCurrentTeam
                        ? "teams-ranking-row teams-ranking-row-current"
                        : "teams-ranking-row"
                    }
                    key={`${entry.position}-${entry.name}`}
                  >
                    <div className="teams-ranking-name">
                      <span className="teams-ranking-position">#{entry.position}</span>
                      <div>
                        <p>{entry.name}</p>
                        <small>
                          {entry.isCurrentTeam ? "Tu Team pelea por La Gloria" : "Team en competencia"}
                        </small>
                      </div>
                    </div>
                    <strong>{entry.points.toLocaleString("es-AR")}</strong>
                  </div>
                ))
              ) : (
                <EmptyPanel
                  title="Todavía no hay Teams compitiendo"
                  copy="Cuando haya Teams con jugadores activos, el ranking real va a aparecer acá."
                />
              )}
            </div>
          </article>

          <article className="teams-panel">
            <h2 className="teams-panel-title">Roles del Team</h2>
            <div className="teams-role-list">
              <div>
                <strong>Capitán</strong>
                <p>El Capitán arma el Team.</p>
              </div>
              <div>
                <strong>DT</strong>
                <p>El DT se gana el puesto sumando puntos.</p>
              </div>
              <div>
                <strong>Jugador activo</strong>
                <p>Ya tiene Aporte confirmado y puede sumar para el Team.</p>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
