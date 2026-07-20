import Link from "next/link";

import type { ClosingAnnouncementConfig } from "@/lib/home/closing-announcement";

type HomeClosingAnnouncementProps = {
  config: ClosingAnnouncementConfig;
};

const positionLabel = {
  1: "Campeón",
  2: "Segundo puesto",
  3: "Tercer puesto",
} as const;

export function HomeClosingAnnouncement({ config }: HomeClosingAnnouncementProps) {
  const isOfficial = config.mode === "official";

  return (
    <section
      aria-labelledby="home-closing-announcement-title"
      className="relative overflow-hidden rounded-[2rem] border border-[#d6bf54]/70 bg-[linear-gradient(145deg,#001a5c_0%,#00327d_55%,#0c6780_100%)] px-5 py-6 text-white shadow-[0_20px_55px_rgba(0,26,92,0.24)] sm:px-8 sm:py-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ffe16d]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-[#9ae1ff]/15 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ffe16d]/60 bg-[#ffe16d]/15 text-2xl" aria-hidden="true">
            {isOfficial ? "🏆" : "✓"}
          </span>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#ffe16d]">
            {config.eyebrow}
          </p>
        </div>

        <h2
          id="home-closing-announcement-title"
          className="max-w-3xl font-serif text-4xl font-bold leading-[0.95] sm:text-5xl"
        >
          {config.title}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#dfe6ff] sm:text-base">
          {config.description}
        </p>

        {isOfficial ? (
          <>
            <div className="mt-6 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ffe16d]">Premio</p>
              <p className="mt-1 font-serif text-3xl font-bold">{config.prizeLabel}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {config.winners.map((winner) => (
                <article
                  key={`${winner.position}-${winner.alias}`}
                  className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ffe16d]">
                    {positionLabel[winner.position]}
                  </p>
                  <p className="mt-2 text-lg font-bold">{winner.alias}</p>
                  <p className="mt-1 text-sm text-[#dfe6ff]">{winner.points} puntos</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[#dfe6ff]">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">Resultados oficiales</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">Pronósticos especiales</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">Ranking final</span>
          </div>
        )}

        <div className="mt-6">
          <Link
            href={config.rankingHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#ffe16d] px-5 py-3 text-sm font-extrabold text-[#1a1c1c] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#fff0a6]"
          >
            {isOfficial ? "Ver ranking completo" : "Ver ranking actual"}
          </Link>
        </div>
      </div>
    </section>
  );
}
