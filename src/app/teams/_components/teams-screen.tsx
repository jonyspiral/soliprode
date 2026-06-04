import Link from "next/link";
import { createGroupAction, joinGroupAction } from "@/app/groups/actions";
import type { TeamInviteContext } from "@/app/teams/_page-state";
import type { TeamsScreenData } from "@/app/teams/_screen-data";
import type { TeamMember } from "@/app/teams/_mock";
import { RankingIcon, SoccerBallIcon, TrophyIcon, UserIcon } from "@/components/app-icons";
import { TeamInviteActions } from "@/app/teams/_components/team-invite-actions";
import { TeamInviteJoinPanel } from "@/app/teams/_components/team-invite-join-panel";

type TeamsScreenProps = {
  authStatus: "guest" | "member";
  hasCurrentTeam: boolean;
  currentAlias: string | null;
  currentParticipationStatus: string | null;
  data: TeamsScreenData;
  inviteContext: TeamInviteContext | null;
  inviteCodePrefill?: string;
  errorMessage?: string | null;
  noticeMessage?: string | null;
  prizePoolLabel: string;
  routeBase?: "/groups" | "/teams";
};

function formatPoints(points: number) {
  return `${points.toLocaleString("es-AR")} pts`;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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

function Avatar({
  name,
  accent,
  size = "md",
}: {
  name: string;
  accent: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "teams-avatar-lg" : size === "sm" ? "teams-avatar-sm" : "teams-avatar";

  return (
    <div
      className={sizeClass}
      style={{
        background: `linear-gradient(135deg, ${accent} 0%, var(--color-primary-strong) 100%)`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
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
  routeBase,
  loginReturnPath,
  inviteCodePrefill,
  inviteContext,
  noticeMessage,
  prizePoolLabel,
  errorMessage,
  inviteCode,
}: {
  authStatus: "guest" | "member";
  hasCurrentTeam: boolean;
  routeBase: "/groups" | "/teams";
  loginReturnPath: string;
  inviteCodePrefill: string;
  inviteContext: TeamInviteContext | null;
  noticeMessage: string | null | undefined;
  prizePoolLabel: string;
  errorMessage: string | null | undefined;
  inviteCode: string | null;
}) {
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

      {hasCurrentTeam && inviteCode ? (
        <div className="teams-invite-box">
          <h3 className="teams-invite-title">Invitá jugadores al Team</h3>
          <p className="teams-support-copy">
            Sumá gente al Plantel. Entran todos. Puntúan los mejores 11.
          </p>
          <TeamInviteActions inviteCode={inviteCode} prizePoolLabel={prizePoolLabel} />
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
  inviteCodePrefill = "",
  errorMessage,
  noticeMessage,
  prizePoolLabel,
  routeBase = "/groups",
}: TeamsScreenProps) {
  const rosterCount = data.starters.length + data.bench.length + data.registered.length;
  const participationLabel =
    currentParticipationStatus === "paid" ? "Aporte confirmado" : "Pendiente de activar";
  const hasRanking = data.ranking.length > 0;
  const loginReturnPath = inviteContext?.code ? `/groups?code=${inviteContext.code}` : routeBase;

  return (
    <div className="teams-screen">
      <section className="teams-hero-grid">
        <article className="teams-score-card">
          <div className="teams-score-copy">
            <span className="teams-chip teams-chip-secondary">{data.statusLabel}</span>
            <h1 className="teams-score-title">{data.teamName}</h1>
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
              <Avatar name={`${data.captain.name} ${data.captain.alias}`} accent={data.captain.accent} />
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
              <Avatar name={data.dt.name} accent={data.dt.accent} size="lg" />
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
            routeBase={routeBase}
            loginReturnPath={loginReturnPath}
            inviteCodePrefill={inviteCodePrefill}
            inviteContext={inviteContext}
            noticeMessage={noticeMessage}
            prizePoolLabel={prizePoolLabel}
            errorMessage={errorMessage}
            inviteCode={data.inviteCode}
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
                      <Avatar name={member.name} accent={member.accent} size="sm" />
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
                      <Avatar name={member.name} accent={member.accent} />
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
                    <UserIcon className="h-4 w-4" />
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
