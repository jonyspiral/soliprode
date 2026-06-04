/* eslint-disable @next/next/no-img-element */
import { buildProxyAvatarSrc } from "@/lib/player/avatar-src";
import { SurfaceCard } from "@/components/surface-card";

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
      ? "border-[var(--color-gold)]/60 bg-[rgba(255,225,109,0.18)] text-[var(--color-ink)]"
      : "border-[var(--color-secondary)]/25 bg-[rgba(154,225,255,0.2)] text-[var(--color-secondary)]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${toneClass}`}
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
  const sizeClass = dominant ? "h-[5.1rem] w-[5.1rem]" : "h-[4rem] w-[4rem]";
  const ringClass = dominant
    ? "border-[3px] border-[var(--color-gold)] shadow-[0_12px_30px_rgba(201,169,0,0.32)]"
    : "border-2 border-white/70 shadow-[0_10px_24px_rgba(0,50,125,0.18)]";

  if (avatarUrl && variant === "real") {
    return (
      <div
        className={[
          "overflow-hidden rounded-full bg-[linear-gradient(135deg,#9ae1ff_0%,#0047ab_100%)]",
          sizeClass,
          ringClass,
        ].join(" ")}
      >
        <img src={buildProxyAvatarSrc(avatarUrl)} alt={label} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={[
        "relative overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.32),transparent_32%),linear-gradient(180deg,#0e5dc1_0%,#05357d_65%,#04285e_100%)]",
        sizeClass,
        ringClass,
      ].join(" ")}
    >
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(8,36,82,0)_0%,rgba(8,36,82,0.42)_35%,rgba(8,36,82,0.9)_100%)]" />
      <div className="absolute left-1/2 top-[22%] h-[28%] w-[28%] -translate-x-1/2 rounded-full bg-[#f6f8ff]" />
      <div className="absolute left-1/2 top-[44%] h-[34%] w-[56%] -translate-x-1/2 rounded-t-[999px] rounded-b-[40%] bg-[#f6f8ff]" />
      <div className="absolute left-1/2 top-[55%] h-[15%] w-[74%] -translate-x-1/2 rounded-full border border-white/15 bg-[linear-gradient(90deg,#ffe16d_0%,#9ae1ff_100%)] opacity-80" />
      <div className="absolute inset-x-[18%] bottom-[14%] h-[8%] rounded-full bg-white/16 blur-[2px]" />
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
  const sizeClass = dominant ? "h-[5.1rem] w-[5.1rem]" : "h-[4rem] w-[4rem]";
  const ringClass = dominant
    ? "border-[3px] border-[var(--color-gold)] shadow-[0_12px_30px_rgba(201,169,0,0.28)]"
    : "border-2 border-white/70 shadow-[0_10px_24px_rgba(0,50,125,0.18)]";
  const innerClass =
    variant === "dummy"
      ? "bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.34),transparent_34%),linear-gradient(180deg,#1355ad_0%,#0c6780_55%,#08345d_100%)]"
      : "bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.24),transparent_32%),linear-gradient(180deg,#1c6fda_0%,#0f4d9c_55%,#0c6780_100%)]";

  return (
    <div
      className={[
        "relative grid place-items-center overflow-hidden",
        sizeClass,
        ringClass,
        "rounded-[1.55rem] bg-white/80 p-[3px]",
        "[clip-path:polygon(50%_0%,89%_11%,100%_42%,84%_100%,16%_100%,0%_42%,11%_11%)]",
      ].join(" ")}
    >
      <div
        className={[
          "relative grid h-full w-full place-items-center overflow-hidden text-white",
          innerClass,
          "[clip-path:polygon(50%_0%,89%_11%,100%_42%,84%_100%,16%_100%,0%_42%,11%_11%)]",
        ].join(" ")}
      >
        <div className="absolute inset-x-[14%] top-[16%] h-[20%] rounded-full border border-white/16 bg-white/8" />
        <div className="absolute inset-x-[20%] bottom-[14%] h-[12%] rounded-full bg-white/12 blur-[2px]" />
        <div className="relative z-10 flex flex-col items-center gap-1">
          <div className="h-2 w-8 rounded-full bg-[var(--color-gold)]/90" />
          <span className="font-serif text-[1.05rem] font-bold uppercase tracking-[0.08em]">
            {buildTeamInitials(label)}
          </span>
          <div className="h-2 w-5 rounded-full bg-white/80" />
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
  const baseHeightClass = dominant ? "min-h-[5.5rem]" : position === 2 ? "min-h-[4.5rem]" : "min-h-[4rem]";
  const baseToneClass =
    position === 1
      ? "bg-[linear-gradient(180deg,#ffe16d_0%,#d4b100_100%)] text-[var(--color-ink)]"
      : position === 2
        ? "bg-[linear-gradient(180deg,#e6ebf5_0%,#c5cedf_100%)] text-[var(--color-primary)]"
        : "bg-[linear-gradient(180deg,#e4dac0_0%,#c9b78b_100%)] text-[var(--color-primary)]";
  const shellClass = dominant
    ? "bg-[linear-gradient(180deg,rgba(255,225,109,0.18)_0%,rgba(255,255,255,0.98)_48%,rgba(255,225,109,0.08)_100%)] border-[var(--color-gold)]/40"
    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,242,248,0.94)_100%)] border-[var(--color-line)]";

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
      <div
        className={[
          "w-full rounded-[1.15rem] border px-2.5 pb-2.5 pt-3 text-center shadow-[0_12px_26px_rgba(0,50,125,0.1)]",
          shellClass,
        ].join(" ")}
      >
        <div className="flex justify-center">
          {team ? (
            <PodiumTeamCrest dominant={dominant} label={label} variant={variant} />
          ) : (
            <PodiumPlayerPortrait avatarUrl={avatarUrl} dominant={dominant} label={label} variant={variant} />
          )}
        </div>
        <div className="mt-2 flex justify-center">
          <span
            className={[
              "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]",
              position === 1
                ? "bg-[var(--color-gold)]/22 text-[var(--color-ink)]"
                : "bg-[var(--color-surface-muted)] text-[var(--color-primary)]",
            ].join(" ")}
          >
            Puesto {position}
          </span>
        </div>
        <p
          className={[
            "mt-2 line-clamp-2 min-h-[2.25rem] font-serif uppercase leading-[1.05]",
            dominant ? "text-[1.15rem] font-bold text-[var(--color-primary)]" : "text-[0.95rem] font-bold text-[var(--color-ink)]",
          ].join(" ")}
        >
          {label}
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          {formatShortPoints(points)}
          {team ? ` · ${activeCount ?? 0} activos` : ""}
        </p>
        {isCurrent ? (
          <div className="mt-2">{renderBadge(team ? "Tu Team" : "Vos", dominant ? "gold" : "blue")}</div>
        ) : (
          <div className="mt-2 h-5" />
        )}
      </div>
      <div
        className={[
          "mt-2 flex w-full items-center justify-center rounded-t-[1rem] px-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
          baseHeightClass,
          baseToneClass,
        ].join(" ")}
      >
        <div>
          <p className="font-serif text-[1.7rem] font-bold leading-none">{position}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
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
    <SurfaceCard title="Podios provisionales" description={description}>
      <div className="grid gap-4">
        <div className="overflow-hidden rounded-[1.2rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,#f5f7fb_0%,#edf2f8_100%)] p-4 shadow-[0_12px_28px_rgba(0,50,125,0.08)]">
          <div className="mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">
              Individual
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              Así arranca la pelea individual mientras se cargan los primeros resultados.
            </p>
          </div>
          <div className="grid grid-cols-3 items-end gap-2">
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

        <div className="overflow-hidden rounded-[1.2rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,#f5f7fb_0%,#edf2f8_100%)] p-4 shadow-[0_12px_28px_rgba(0,50,125,0.08)]">
          <div className="mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c6780]">
              Teams
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
              El ranking de Teams arranca con Planteles completos o con dummies de competencia.
            </p>
          </div>
          <div className="grid grid-cols-3 items-end gap-2">
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
