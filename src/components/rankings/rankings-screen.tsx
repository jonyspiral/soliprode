"use client";

import { useState } from "react";
import Link from "next/link";
import { GroupAvatar } from "@/components/groups/group-avatar";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { RankingPodiumBlocks, type IndividualPodiumItem, type TeamPodiumItem } from "@/components/rankings/ranking-podium-blocks";
import { SurfaceCard } from "@/components/surface-card";
import styles from "@/components/rankings/rankings-screen.module.css";

type IndividualRankingRow = {
  avatarSeed: string;
  avatarUrl: string | null;
  avatarVariant: string | null;
  fallbackAvatarUrl: string | null;
  isCurrentUser: boolean;
  points: number;
  position: number;
  profileId: string;
  teamName: string | null;
  userLabel: string;
};

type TeamRankingRow = {
  activeCount: number;
  avatarSeed: string;
  avatarUrl: string | null;
  avatarVariant: string | null;
  fallbackAvatarUrl: string | null;
  isCurrentTeam: boolean;
  name: string;
  points: number;
  position: number;
  teamId: string;
};

type RankingsScreenProps = {
  hasComputedResults: boolean;
  individualPodium: IndividualPodiumItem[];
  individualPositionLabel: string;
  individualRows: IndividualRankingRow[];
  individualStatusLabel: string;
  individualUserPoints: string;
  isCurrentUserActive: boolean;
  teamCtaHref: string;
  teamPodium: TeamPodiumItem[];
  teamPositionDetail: string;
  teamPositionLabel: string;
  teamRows: TeamRankingRow[];
  updatedLabel: string | null;
};

type RankingTab = "individual" | "teams";

function renderBadge(label: string, tone: "blue" | "gold" = "blue") {
  const toneClass = tone === "gold" ? styles.badgeGold : styles.badgeBlue;

  return <span className={`${styles.badge} ${toneClass}`}>{label}</span>;
}

function RankingHeader({ updatedLabel }: { updatedLabel: string | null }) {
  return (
    <section className={styles.header}>
      <div className={styles.headerCopy}>
        <div className={styles.headerTopline}>
          <span className={styles.worldCupChip}>Mundial 2026</span>
        </div>
        <h1 className={styles.headerTitle}>Ranking</h1>
        <p className={styles.headerSubtitle}>
          Individual y Teams
          {updatedLabel ? ` · Actualizado ${updatedLabel}` : ""}
        </p>
      </div>
    </section>
  );
}

function RankingTabs({
  activeTab,
  onChange,
}: {
  activeTab: RankingTab;
  onChange: (value: RankingTab) => void;
}) {
  return (
    <div className={styles.tabsShell} role="tablist" aria-label="Tipos de ranking">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "individual"}
        className={`${styles.tabButton} ${activeTab === "individual" ? styles.tabButtonActive : ""}`}
        onClick={() => onChange("individual")}
      >
        Individual
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "teams"}
        className={`${styles.tabButton} ${activeTab === "teams" ? styles.tabButtonActive : ""}`}
        onClick={() => onChange("teams")}
      >
        Teams
      </button>
    </div>
  );
}

function PositionCard({
  activeTab,
  individualPositionLabel,
  individualStatusLabel,
  individualUserPoints,
  isCurrentUserActive,
  teamCtaHref,
  teamPositionDetail,
  teamPositionLabel,
}: {
  activeTab: RankingTab;
  individualPositionLabel: string;
  individualStatusLabel: string;
  individualUserPoints: string;
  isCurrentUserActive: boolean;
  teamCtaHref: string;
  teamPositionDetail: string;
  teamPositionLabel: string;
}) {
  if (activeTab === "individual") {
    return (
      <SurfaceCard className={styles.positionCard}>
        <div className={styles.positionCardHeader}>
          <div>
            <p className={styles.positionKicker}>Tu posición</p>
            <h2 className={styles.positionTitle}>Ranking Individual</h2>
          </div>
          {renderBadge(individualStatusLabel)}
        </div>

        <div className={styles.positionMetrics}>
          <div>
            <p className={styles.positionValue}>{individualPositionLabel}</p>
            <p className={styles.positionMeta}>{individualUserPoints}</p>
          </div>
        </div>

        <p className={styles.positionCopy}>
          {isCurrentUserActive
            ? "Tu lugar individual ya está entrando en la pelea oficial."
            : "Tus picks están guardados. Activá tu Pase Solidario para competir."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className={styles.positionCard}>
      <div className={styles.positionCardHeader}>
        <div>
          <p className={styles.positionKicker}>Tu posición</p>
          <h2 className={styles.positionTitle}>Ranking de Teams</h2>
        </div>
        {teamPositionLabel === "Sin Team" ? renderBadge("Sin Team") : renderBadge("Tu Team", "gold")}
      </div>

      <div className={styles.positionMetrics}>
        <div>
          <p className={styles.positionValue}>{teamPositionLabel}</p>
          <p className={styles.positionMeta}>{teamPositionDetail}</p>
        </div>
      </div>

      {teamPositionLabel === "Sin Team" ? (
        <div className={styles.positionActions}>
          <p className={styles.positionCopy}>Creá o sumate a un Team para entrar a la tabla social.</p>
          <Link href={teamCtaHref} className={styles.positionPrimaryCta}>
            Crear o sumarme
          </Link>
        </div>
      ) : (
        <p className={styles.positionCopy}>Tu Team ya está compitiendo en la tabla social del torneo.</p>
      )}
    </SurfaceCard>
  );
}

function IndividualList({ rows }: { rows: IndividualRankingRow[] }) {
  const visibleRows = rows.length > 0 ? rows.slice(0, 10) : [];

  return (
    <SurfaceCard className={styles.listCard}>
      <div className={styles.listHeader}>
        <div>
          <p className={styles.listKicker}>Top 10</p>
          <h2 className={styles.listTitle}>Ranking Individual</h2>
        </div>
      </div>

      <div className={styles.listShell}>
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <div key={row.profileId} className={`${styles.listRow} ${row.isCurrentUser ? styles.listRowCurrent : ""}`}>
              <span className={styles.listPosition}>{row.position}</span>
              <div className={styles.listIdentity}>
                <PlayerAvatar
                  fallbackImageUrl={row.fallbackAvatarUrl}
                  imageUrl={row.avatarUrl}
                  label={row.userLabel}
                  seed={row.avatarSeed}
                  size="sm"
                  variant={row.avatarVariant}
                />
                <div className={styles.listIdentityCopy}>
                  <div className={styles.listNameLine}>
                    <p className={styles.listName}>{row.userLabel}</p>
                    {row.isCurrentUser ? renderBadge("Vos") : null}
                  </div>
                  <p className={styles.listMeta}>{row.teamName ?? "Sin Team"}</p>
                </div>
              </div>
              <span className={styles.listPoints}>{row.points}</span>
            </div>
          ))
        ) : (
          Array.from({ length: 10 }, (_, index) => (
            <div key={`individual-placeholder-${index + 1}`} className={styles.listRow}>
              <span className={styles.listPosition}>{index + 1}</span>
              <div className={styles.listIdentity}>
                <PlayerAvatar label={`Jugador ${index + 1}`} seed={`placeholder-player-${index + 1}`} size="sm" />
                <div className={styles.listIdentityCopy}>
                  <p className={styles.listName}>Esperando jugadores</p>
                  <p className={styles.listMeta}>Sin Team</p>
                </div>
              </div>
              <span className={styles.listPoints}>0</span>
            </div>
          ))
        )}
      </div>
    </SurfaceCard>
  );
}

function TeamsList({ rows }: { rows: TeamRankingRow[] }) {
  const visibleRows = rows.length > 0 ? rows.slice(0, 10) : [];

  return (
    <SurfaceCard className={styles.listCard}>
      <div className={styles.listHeader}>
        <div>
          <p className={styles.listKicker}>Top 10</p>
          <h2 className={styles.listTitle}>Ranking de Teams</h2>
        </div>
      </div>

      <div className={styles.listShell}>
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <div key={row.teamId} className={`${styles.listRow} ${row.isCurrentTeam ? styles.listRowCurrentTeam : ""}`}>
              <span className={styles.listPosition}>{row.position}</span>
              <div className={styles.listIdentity}>
                <GroupAvatar
                  fallbackImageUrl={row.fallbackAvatarUrl}
                  imageUrl={row.avatarUrl}
                  label={row.name}
                  seed={row.avatarSeed}
                  size="sm"
                  variant={row.avatarVariant}
                />
                <div className={styles.listIdentityCopy}>
                  <div className={styles.listNameLine}>
                    <p className={styles.listName}>{row.name}</p>
                    {row.isCurrentTeam ? renderBadge("Tu Team", "gold") : null}
                  </div>
                  <p className={styles.listMeta}>{row.activeCount} jugadores activos</p>
                </div>
              </div>
              <span className={styles.listPoints}>{row.points}</span>
            </div>
          ))
        ) : (
          Array.from({ length: 10 }, (_, index) => (
            <div key={`team-placeholder-${index + 1}`} className={styles.listRow}>
              <span className={styles.listPosition}>{index + 1}</span>
              <div className={styles.listIdentity}>
                <GroupAvatar label={`Team ${index + 1}`} seed={`placeholder-team-${index + 1}`} size="sm" />
                <div className={styles.listIdentityCopy}>
                  <p className={styles.listName}>Esperando Teams</p>
                  <p className={styles.listMeta}>0 jugadores activos</p>
                </div>
              </div>
              <span className={styles.listPoints}>0</span>
            </div>
          ))
        )}
      </div>
    </SurfaceCard>
  );
}

export function RankingsScreen({
  hasComputedResults,
  individualPodium,
  individualPositionLabel,
  individualRows,
  individualStatusLabel,
  individualUserPoints,
  isCurrentUserActive,
  teamCtaHref,
  teamPodium,
  teamPositionDetail,
  teamPositionLabel,
  teamRows,
  updatedLabel,
}: RankingsScreenProps) {
  const [activeTab, setActiveTab] = useState<RankingTab>("individual");

  return (
    <div className={styles.screenStack}>
      <RankingHeader updatedLabel={updatedLabel} />
      <RankingTabs activeTab={activeTab} onChange={setActiveTab} />
      <RankingPodiumBlocks
        activeTab={activeTab}
        hasComputedResults={hasComputedResults}
        individual={individualPodium}
        teams={teamPodium}
      />
      <PositionCard
        activeTab={activeTab}
        individualPositionLabel={individualPositionLabel}
        individualStatusLabel={individualStatusLabel}
        individualUserPoints={individualUserPoints}
        isCurrentUserActive={isCurrentUserActive}
        teamCtaHref={teamCtaHref}
        teamPositionDetail={teamPositionDetail}
        teamPositionLabel={teamPositionLabel}
      />
      {activeTab === "individual" ? <IndividualList rows={individualRows} /> : <TeamsList rows={teamRows} />}
    </div>
  );
}
