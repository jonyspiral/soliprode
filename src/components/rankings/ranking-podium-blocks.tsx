import { GroupAvatar } from "@/components/groups/group-avatar";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { SurfaceCard } from "@/components/surface-card";
import styles from "@/components/rankings/ranking-podium-blocks.module.css";

export type IndividualPodiumItem = {
  avatarSeed?: string | null;
  avatarUrl?: string | null;
  avatarVariant?: string | null;
  fallbackAvatarUrl?: string | null;
  isCurrent?: boolean;
  key: string;
  label: string;
  points: number;
  position: number;
  variant?: "real" | "dummy";
};

export type TeamPodiumItem = {
  activeCount?: number;
  avatarSeed?: string | null;
  avatarUrl?: string | null;
  avatarVariant?: string | null;
  fallbackAvatarUrl?: string | null;
  isCurrent?: boolean;
  key: string;
  name: string;
  points: number;
  position: number;
  variant?: "real" | "dummy";
};

type RankingPodiumBlocksProps = {
  activeTab?: "individual" | "teams";
  hasComputedResults: boolean;
  individual: IndividualPodiumItem[];
  teams: TeamPodiumItem[];
};

const PODIUM_PLAYER_DUMMIES = ["Jugador invitado", "Nuevo jugador", "Futbolero"] as const;
const PODIUM_TEAM_DUMMIES = ["Rojito de mi vida", "Team Mundial", "Plantel Futbolero"] as const;

function formatShortPoints(points: number) {
  return `${points.toLocaleString("es-AR")} pts`;
}

function renderBadge(label: string, tone: "blue" | "gold" = "blue") {
  const toneClass = tone === "gold" ? styles.badgeGold : styles.badgeBlue;

  return <span className={`${styles.badge} ${toneClass}`}>{label}</span>;
}

function normalizeIndividual(items: IndividualPodiumItem[]) {
  const sorted = [...items].sort((a, b) => a.position - b.position).slice(0, 3);
  const filled = [...sorted];

  while (filled.length < 3) {
    const position = filled.length + 1;
    filled.push({
      avatarSeed: `placeholder-player-${position}`,
      avatarUrl: null,
      avatarVariant: null,
      fallbackAvatarUrl: null,
      isCurrent: false,
      key: `placeholder-individual-${position}`,
      label: PODIUM_PLAYER_DUMMIES[position - 1] ?? `Jugador ${position}`,
      points: 0,
      position,
      variant: "dummy",
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
      activeCount: 0,
      avatarSeed: `placeholder-team-${position}`,
      avatarUrl: null,
      avatarVariant: null,
      fallbackAvatarUrl: null,
      isCurrent: false,
      key: `placeholder-team-${position}`,
      name: PODIUM_TEAM_DUMMIES[position - 1] ?? `Team ${position}`,
      points: 0,
      position,
      variant: "dummy",
    });
  }

  return filled.map((item) => ({
    ...item,
    activeCount: item.activeCount ?? 0,
    variant: item.variant ?? "real",
  }));
}

function PodiumEntryCard({
  activeCount,
  avatarSeed,
  avatarUrl,
  avatarVariant,
  fallbackAvatarUrl,
  dominant = false,
  isCurrent = false,
  label,
  points,
  position,
  team = false,
}: {
  activeCount?: number;
  avatarSeed?: string | null;
  avatarUrl?: string | null;
  avatarVariant?: string | null;
  fallbackAvatarUrl?: string | null;
  dominant?: boolean;
  isCurrent?: boolean;
  label: string;
  points: number;
  position: number;
  team?: boolean;
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
      <div className={`${styles.entryCard} ${shellClass}`}>
        <div className={styles.entryMedia}>
          {team ? (
            <GroupAvatar
              fallbackImageUrl={fallbackAvatarUrl}
              imageUrl={avatarUrl}
              label={label}
              seed={avatarSeed ?? label}
              size={dominant ? "lg" : "md"}
              variant={avatarVariant}
            />
          ) : (
            <PlayerAvatar
              fallbackImageUrl={fallbackAvatarUrl}
              imageUrl={avatarUrl}
              label={label}
              seed={avatarSeed ?? label}
              size={dominant ? "lg" : "md"}
              variant={avatarVariant}
            />
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
      <div className={`${styles.podiumBase} ${baseHeightClass} ${baseToneClass}`}>
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

export function RankingPodiumBlocks({
  activeTab,
  hasComputedResults,
  individual,
  teams,
}: RankingPodiumBlocksProps) {
  const individualPodium = normalizeIndividual(individual);
  const teamPodium = normalizeTeams(teams);
  const description = hasComputedResults
    ? "Así viene la pelea ahora mismo."
    : "Todavía no hay partidos computados. Todos arrancan desde cero.";

  const renderBlock = (tab: "individual" | "teams") => {
    if (tab === "individual") {
      return (
        <div className={styles.block}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>Individual</h2>
            <p className={styles.blockCopy}>Top 3 provisional del ranking individual.</p>
          </div>
          <div className={styles.podiumGrid}>
            {[individualPodium[1], individualPodium[0], individualPodium[2]].map((entry) => (
              <PodiumEntryCard
                key={entry.key}
                avatarSeed={entry.avatarSeed}
                avatarUrl={entry.avatarUrl}
                avatarVariant={entry.avatarVariant}
                dominant={entry.position === 1}
                fallbackAvatarUrl={entry.fallbackAvatarUrl}
                isCurrent={entry.isCurrent}
                label={entry.label}
                points={entry.points}
                position={entry.position}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={`${styles.block} ${styles.blockTeams}`}>
        <div className={styles.blockHeader}>
          <h2 className={`${styles.blockTitle} ${styles.blockTitleTeams}`}>Teams</h2>
          <p className={styles.blockCopy}>Top 3 provisional de la tabla social.</p>
        </div>
        <div className={styles.podiumGrid}>
          {[teamPodium[1], teamPodium[0], teamPodium[2]].map((entry) => (
            <PodiumEntryCard
              key={entry.key}
              activeCount={entry.activeCount}
              avatarSeed={entry.avatarSeed}
              avatarUrl={entry.avatarUrl}
              avatarVariant={entry.avatarVariant}
              dominant={entry.position === 1}
              fallbackAvatarUrl={entry.fallbackAvatarUrl}
              isCurrent={entry.isCurrent}
              label={entry.name}
              points={entry.points}
              position={entry.position}
              team
            />
          ))}
        </div>
      </div>
    );
  };

  if (activeTab) {
    return (
      <SurfaceCard className={`${styles.surfaceCard} ${styles.surfaceCardCompact}`}>
        <div className={styles.compactHeader}>
          <p className={styles.compactKicker}>Podio provisional</p>
          <p className={styles.compactCopy}>{description}</p>
        </div>
        {renderBlock(activeTab)}
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard title="Podios provisionales" description={description} className={styles.surfaceCard}>
      <div className={styles.blocksGrid}>
        {renderBlock("individual")}
        {renderBlock("teams")}
      </div>
    </SurfaceCard>
  );
}
