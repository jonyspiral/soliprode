import Link from "next/link";

import { PlayerAvatar } from "@/components/profile/player-avatar";
import { finalTournamentResults } from "@/lib/final/final-results";

function formatPoints(points: number) {
  return `${points.toLocaleString("es-AR")} pts`;
}

function getMedal(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  return "🥉";
}

function getPositionLabel(position: number) {
  if (position === 1) return "Campeón";
  if (position === 2) return "Segundo puesto";
  return "Tercer puesto";
}

export function FinalTournamentScreen() {
  const champion = finalTournamentResults.standings[0];
  const podium = finalTournamentResults.standings.slice(0, 3);

  return (
    <div className="grid gap-6 pb-10 md:gap-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-[#d6bf54]/70 bg-[linear-gradient(145deg,#001a5c_0%,#00327d_55%,#0c6780_100%)] px-5 py-8 text-white shadow-[0_24px_70px_rgba(0,26,92,0.3)] sm:px-8 sm:py-10 md:px-12 md:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#ffe16d]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#9ae1ff]/18 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#ffe16d]/60 bg-[#ffe16d]/15 text-2xl" aria-hidden="true">
              🏆
            </span>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#ffe16d]">
              {finalTournamentResults.eyebrow}
            </p>
          </div>

          <h1 className="mt-6 max-w-4xl font-serif text-[2.7rem] font-bold leading-[0.92] tracking-[-0.035em] sm:text-6xl md:text-7xl">
            {finalTournamentResults.title}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-[#dfe6ff] sm:text-base sm:leading-7">
            {finalTournamentResults.description}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {finalTournamentResults.metrics.map((metric) => (
              <article key={metric.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="font-serif text-3xl font-bold text-white sm:text-4xl">{metric.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
                  {metric.label}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/rankings"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#ffe16d] px-5 py-3 text-sm font-extrabold text-[#1a1c1c] shadow-[0_10px_26px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#fff0a6]"
            >
              Ver ranking completo
            </Link>
            <Link
              href="/reglamento"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/16"
            >
              Ver reglamento
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-[#e4c850] bg-[linear-gradient(135deg,#fff8d7_0%,#ffffff_55%,#eaf7ff_100%)] p-5 shadow-[0_18px_48px_rgba(0,50,125,0.12)] sm:p-8 md:p-10">
        <div className="pointer-events-none absolute right-5 top-4 text-7xl opacity-10" aria-hidden="true">
          🏆
        </div>
        <div className="relative z-10 grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <PlayerAvatar label={champion.alias} seed="🏆" size="lg" variant="emoji" />

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Campeón SoliProde 2026
            </p>
            <h2 className="mt-2 font-serif text-4xl font-bold uppercase leading-none text-[var(--color-ink)] sm:text-5xl">
              {champion.alias}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              {champion.matchPoints} puntos en partidos + {champion.specialPoints} en pronósticos especiales.
            </p>
          </div>

          <div className="rounded-3xl border border-[#d9bd45] bg-[#ffe16d] px-6 py-5 text-center shadow-[0_12px_28px_rgba(122,94,0,0.18)]">
            <p className="font-serif text-5xl font-bold leading-none text-[#1a1c1c]">{champion.points}</p>
            <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#4c420f]">puntos finales</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="final-podium-title" className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_14px_38px_rgba(0,50,125,0.08)] sm:p-8">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary)]">Resultados oficiales</p>
          <h2 id="final-podium-title" className="mt-2 font-serif text-3xl font-bold uppercase leading-none text-[var(--color-ink)] sm:text-4xl">
            Podio final
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Siete puntos separaron al campeón del segundo puesto.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {podium.map((standing) => {
            const isChampion = standing.position === 1;

            return (
              <article
                key={standing.alias}
                className={[
                  "relative overflow-hidden rounded-3xl border p-5",
                  isChampion
                    ? "border-[#d8bb3d] bg-[linear-gradient(145deg,#fff8cd,#ffffff)] shadow-[0_14px_34px_rgba(122,94,0,0.13)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface-muted)]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-3xl" aria-hidden="true">{getMedal(standing.position)}</span>
                  <span className="rounded-full border border-[var(--color-line)] bg-white/75 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-primary)]">
                    {getPositionLabel(standing.position)}
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-3">
                  <PlayerAvatar
                    label={standing.alias}
                    seed={standing.position === 1 ? "🏆" : standing.alias}
                    size={standing.position === 1 ? "lg" : "md"}
                    variant={standing.position === 1 ? "emoji" : null}
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold text-[var(--color-ink)]">{standing.alias}</h3>
                    <p className="mt-1 font-serif text-3xl font-bold text-[var(--color-primary)]">
                      {standing.points}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="final-top-ten-title" className="overflow-hidden rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_14px_38px_rgba(0,50,125,0.08)]">
        <div className="border-b border-[var(--color-line)] px-5 py-5 sm:px-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary)]">Tabla definitiva</p>
          <h2 id="final-top-ten-title" className="mt-2 font-serif text-3xl font-bold uppercase leading-none text-[var(--color-ink)] sm:text-4xl">
            Top 10 individual
          </h2>
        </div>

        <div>
          {finalTournamentResults.standings.map((standing) => (
            <article
              key={standing.alias}
              className="grid grid-cols-[2.8rem_1fr_auto] items-center gap-3 border-b border-[var(--color-line)] px-5 py-4 last:border-b-0 sm:grid-cols-[3.5rem_1fr_auto_auto] sm:px-8"
            >
              <span className="font-serif text-2xl font-bold text-[var(--color-primary)]">{standing.position}º</span>
              <div className="min-w-0">
                <p className="truncate font-bold text-[var(--color-ink)]">{standing.alias}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {standing.specialPoints > 0
                    ? `${standing.matchPoints} partidos + ${standing.specialPoints} especiales`
                    : `${standing.matchPoints} puntos en partidos`}
                </p>
              </div>
              <span className="hidden text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] sm:block">
                {standing.position <= 3 ? getPositionLabel(standing.position) : "Finalista"}
              </span>
              <strong className="text-right text-base text-[var(--color-primary)] sm:text-lg">
                {formatPoints(standing.points)}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-[#d8bb3d] bg-[linear-gradient(145deg,#001a5c,#00327d)] p-6 text-white shadow-[0_18px_44px_rgba(0,26,92,0.2)] sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#ffe16d]">Premio individual</p>
          <h2 className="mt-2 font-serif text-4xl font-bold uppercase leading-none">Pozo {finalTournamentResults.prize.poolLabel}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#dfe6ff]">1º · 90%</p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#ffe16d]">{finalTournamentResults.prize.firstLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#dfe6ff]">2º · 10%</p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#ffe16d]">{finalTournamentResults.prize.secondLabel}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#dfe6ff]">
            Tercer puesto: {finalTournamentResults.prize.thirdLabel.toLowerCase()}.
          </p>
        </article>

        <article className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[0_14px_38px_rgba(0,50,125,0.08)] sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary)]">Ranking de Teams</p>
          <h2 className="mt-2 font-serif text-4xl font-bold uppercase leading-none text-[var(--color-ink)]">
            {finalTournamentResults.teamLeader.name}
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white">
              {formatPoints(finalTournamentResults.teamLeader.points)}
            </span>
            <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">
              {finalTournamentResults.teamLeader.activePlayers} activos
            </span>
          </div>
          <div className="mt-5 rounded-2xl border border-[#e1c75c] bg-[#fff8d7] p-4 text-sm leading-6 text-[#4c420f]">
            {finalTournamentResults.teamLeader.note}
          </div>
        </article>
      </section>

      <section aria-labelledby="final-specials-title" className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_14px_38px_rgba(0,50,125,0.08)] sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--color-primary)]">Pronósticos especiales</p>
        <h2 id="final-specials-title" className="mt-2 font-serif text-3xl font-bold uppercase leading-none text-[var(--color-ink)] sm:text-4xl">
          Resoluciones oficiales
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {finalTournamentResults.specials.map((special) => (
            <article key={special.label} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">{special.label}</p>
                <p className="mt-1 font-bold text-[var(--color-ink)]">{special.result}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#ffe16d] px-3 py-2 text-xs font-extrabold text-[#1a1c1c]">
                {special.points} pts
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-[#9ad8ed] bg-[linear-gradient(135deg,#eaf9ff,#ffffff_55%,#fff8d7)] p-6 text-center shadow-[0_16px_42px_rgba(0,50,125,0.09)] sm:p-10">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-[0_10px_24px_rgba(0,50,125,0.12)]" aria-hidden="true">
          ❤️
        </div>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          {finalTournamentResults.cause.eyebrow}
        </p>
        <h2 className="mx-auto mt-3 max-w-3xl font-serif text-4xl font-bold uppercase leading-[0.98] text-[var(--color-ink)] sm:text-5xl">
          {finalTournamentResults.cause.title}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          {finalTournamentResults.cause.description}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/quienes-somos" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">
            Conocer la causa
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-primary)]/25 bg-white px-5 py-3 text-sm font-bold text-[var(--color-primary)]">
            Volver al inicio
          </Link>
        </div>
      </section>
    </div>
  );
}
