/* eslint-disable @next/next/no-img-element */
import { buildProxyAvatarSrc } from "@/lib/player/avatar-src";
import { SurfaceCard } from "@/components/surface-card";
import styles from "@/components/rankings/ranking-podium-blocks.module.css";

export type IndividualPodiumItem = {
  key: string;
  label: string;
  points: number;
  position: number;
  avatarUrl?: string | null;
  isCurrent?: boolean;
  variant?: "real" | "dummy";
};

export type TeamPodiumItem = {
  key: string;
  name: string;
  points: number;
  position: number;
  activeCount?: number;
  isCurrent?: boolean;
  variant?: "real" | "dummy";
};

type RankingPodiumBlocksProps = {
  hasComputedResults: boolean;
  individual: IndividualPodiumItem[];
  teams: TeamPodiumItem[];
};

const PODIUM_PLAYER_DUMMIES = ["Jugador invitado", "Nuevo jugador", "Futbolero"] as const;
const PODIUM_TEAM_DUMMIES = ["Rojito de mi vida", "Team Mundial", "Plantel Futbolero"] as const;

function formatShortPoints(points: number) {
  return `${points.toLocaleString("es-AR")} pts`;
}

function buildTeamInitials(name: string) {
  const cleaned = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return cleaned || "TM";
}

function renderBadge(label: string, tone: "blue" | "gold" = "blue") {
  const toneClass =
    tone === "gold"
      ? styles.badgeGold
      : styles.badgeBlue;

  return (
    <span
      className={`${styles.badge} ${toneClass}`}
    >
      {label}
    </span>
  );
}

function normalizeIndividual(items: IndividualPodiumItem[]) {
  const sorted = [...items].sort((a, b) => a.position - b.position).slice(0, 3);
  const filled = [...sorted];

  while (filled.length < 3) {
    const position = filled.length + 1;
    filled.push({
      key: `placeholder-individual-${position}`,
      label: PODIUM_PLAYER_DUMMIES[position - 1] ?? `Jugador ${position}`,
      points: 0,
      position,
      variant: "dummy",
      isCurrent: false,
      avatarUrl: null,
    });
  }

  return filled.map((item) => ({
    ...item,
    variant: item.variant ?? "real",
  }));
}

function normalizeTeams(items: TeamPodiumItem[]) {
  const sorted = [...items].sort((a, b) => a.position - b.position).slice(0, 3);
  const filled = [...sorted];

  while (filled.length < 3) {
    const position = filled.length + 1;
    filled.push({
      key: `placeholder-team-${position}`,
      name: PODIUM_TEAM_DUMMIES[position - 1] ?? `Team ${position}`,
      points: 0,
      position,
      activeCount: 0,
      variant: "dummy",
      isCurrent: false,
    });
  }

  return filled.map((item) => ({
    ...item,
    activeCount: item.activeCount ?? 0,
    variant: item.variant ?? "real",
  }));
}

function PodiumPlayerPortrait({
  avatarUrl,
  dominant,
  label,
  variant,
}: {
  avatarUrl?: string | null;
  dominant: boolean;
  label: string;
  variant: "real" | "dummy";
}) {
  const shellClass = dominant ? styles.portraitShellDominant : styles.portraitShell;
  const sizeClass = dominant ? styles.portraitSizeDominant : styles.portraitSize;

  if (avatarUrl && variant === "real") {
    return (
      <div
        className={`${styles.playerPortrait} ${shellClass} ${sizeClass}`}
      >
        <img src={buildProxyAvatarSrc(avatarUrl)} alt={label} className={styles.playerPortraitImage} />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${styles.playerPortrait} ${styles.playerPortraitFallback} ${shellClass} ${sizeClass}`}
    >
      <span className={styles.playerPortraitShade} />
      <span className={styles.playerPortraitHead} />
      <span className={styles.playerPortraitBody} />
      <span className={styles.playerPortraitJersey} />
      <span className={styles.playerPortraitGlow} />
    </div>
  );
}

function PodiumTeamCrest({
  dominant,
  label,
  variant,
}: {
  dominant: boolean;
  label: string;
  variant: "real" | "dummy";
}) {
  const shellClass = dominant ? styles.crestShellDominant : styles.crestShell;
  const sizeClass = dominant ? styles.crestSizeDominant : styles.crestSize;
  const innerClass = variant === "dummy" ? styles.crestInnerDummy : styles.crestInnerReal;

  return (
    <div
      className={`${styles.teamCrestShell} ${shellClass} ${sizeClass}`}
    >
      <div className={`${styles.teamCrestInner} ${innerClass}`}>
        <span className={styles.teamCrestTopBand} />
        <span className={styles.teamCrestBottomGlow} />
        <div className={styles.teamCrestContent}>
          <span className={styles.teamCrestStar} />
          <span className={styles.teamCrestText}>{buildTeamInitials(label)}</span>
          <span className={styles.teamCrestBall} />
        </div>
      </div>
    </div>
  );
}

function PodiumEntryCard({
  activeCount,
  avatarUrl,
  dominant = false,
  isCurrent = false,
  label,
  points,
  position,
  team = false,
  variant,
}: {
  activeCount?: number;
  avatarUrl?: string | null;
  dominant?: boolean;
  isCurrent?: boolean;
  label: string;
  points: number;
  position: number;
  team?: boolean;
  variant: "real" | "dummy";
}) {
  const baseHeightClass =
    dominant ? styles.podiumBaseTall : position === 2 ? styles.podiumBaseMid : styles.podiumBaseShort;
  const baseToneClass =
    position === 1
      ? styles.podiumBaseGold
      : position === 2
        ? styles.podiumBaseSilver
        : styles.podiumBaseBronze;
  const shellClass = dominant ? styles.entryShellDominant : styles.entryShell;

  return (
    <div className={styles.entryColumn}>
      <div
        className={`${styles.entryCard} ${shellClass}`}
      >
        <div className={styles.entryMedia}>
          {team ? (
            <PodiumTeamCrest dominant={dominant} label={label} variant={variant} />
          ) : (
            <PodiumPlayerPortrait avatarUrl={avatarUrl} dominant={dominant} label={label} variant={variant} />
          )}
        </div>
        <div className={styles.entryPositionWrap}>
          <span
            className={`${styles.entryPositionChip} ${position === 1 ? styles.entryPositionChipGold : styles.entryPositionChipNeutral}`}
          >
            Puesto {position}
          </span>
        </div>
        <p className={`${styles.entryTitle} ${dominant ? styles.entryTitleDominant : styles.entryTitleRegular}`}>
          {label}
        </p>
        <p className={styles.entryMeta}>
          {formatShortPoints(points)}
          {team ? ` · ${activeCount ?? 0} activos` : ""}
        </p>
        {isCurrent ? (
          <div className={styles.entryBadgeSlot}>{renderBadge(team ? "Tu Team" : "Vos", dominant ? "gold" : "blue")}</div>
        ) : (
          <div className={styles.entryBadgeSlot} />
        )}
      </div>
      <div
        className={`${styles.podiumBase} ${baseHeightClass} ${baseToneClass}`}
      >
        <div>
          <p className={styles.podiumBaseNumber}>{position}</p>
          <p className={styles.podiumBaseLabel}>
            {position === 1 ? "Lidera" : position === 2 ? "Persigue" : "Acecha"}
          </p>
        </div>
      </div>
    </div>
  );
}

export function RankingPodiumBlocks({ hasComputedResults, individual, teams }: RankingPodiumBlocksProps) {
  const individualPodium = normalizeIndividual(individual);
  const teamPodium = normalizeTeams(teams);
  const description = hasComputedResults
    ? "Así viene la pelea ahora mismo."
    : "Todavía no hay partidos computados. Todos arrancan desde cero.";

  return (
    <SurfaceCard title="Podios provisionales" description={description} className={styles.surfaceCard}>
      <div className={styles.blocksGrid}>
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>
              Individual
            </h2>
            <p className={styles.blockCopy}>
              Así arranca la pelea individual mientras se cargan los primeros resultados.
            </p>
          </div>
          <div className={styles.podiumGrid}>
            {[individualPodium[1], individualPodium[0], individualPodium[2]].map((entry) => (
              <PodiumEntryCard
                key={entry.key}
                avatarUrl={entry.avatarUrl}
                dominant={entry.position === 1}
                isCurrent={entry.isCurrent}
                label={entry.label}
                points={entry.points}
                position={entry.position}
                variant={entry.variant}
              />
            ))}
          </div>
        </div>

        <div className={`${styles.block} ${styles.blockTeams}`}>
          <div className={styles.blockHeader}>
            <h2 className={`${styles.blockTitle} ${styles.blockTitleTeams}`}>
              Teams
            </h2>
            <p className={styles.blockCopy}>
              El ranking de Teams arranca con Planteles completos o con dummies de competencia.
            </p>
          </div>
          <div className={styles.podiumGrid}>
            {[teamPodium[1], teamPodium[0], teamPodium[2]].map((entry) => (
              <PodiumEntryCard
                key={entry.key}
                activeCount={entry.activeCount}
                dominant={entry.position === 1}
                isCurrent={entry.isCurrent}
                label={entry.name}
                points={entry.points}
                position={entry.position}
                team
                variant={entry.variant}
              />
            ))}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
