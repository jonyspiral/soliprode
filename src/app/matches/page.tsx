import { CountryFlag } from "@/components/country-flag";
import {
  MatchPlaceholderCard,
  PageStack,
  StatCard,
} from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

export default function MatchesPage() {
  return (
    <PageStack>
      <section className="rounded-2xl bg-[linear-gradient(180deg,#0047ab_0%,#00327d_100%)] p-4 text-white shadow-[0_18px_42px_rgba(0,50,125,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2.2rem] font-bold uppercase leading-[0.94] tracking-[-0.03em]">
              Cargá tu
              <br />
              pronóstico
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#dfe6ff]">Jornada 12 · Cierra en 2h 45m</p>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#dfe6ff]">
            Match day
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] shadow-[0_6px_0_0_#00327d]">
        <div className="flex items-center justify-between bg-[var(--color-primary)] px-4 py-2 text-white">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em]">Copa Global</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[12px] font-semibold">Hoy 21:00</span>
        </div>
        <div className="grid gap-4 bg-white p-4">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-4">
            <div className="flex items-center gap-3">
              <CountryFlag country="Argentina" label="Argentina" size="md" />
              <span className="font-serif text-[1.6rem] font-bold uppercase">ARG</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[var(--color-ink)]">-</button>
              <span className="w-8 text-center font-serif text-[2.2rem] font-bold text-[var(--color-primary)]">0</span>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">+</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CountryFlag country="Brasil" label="Brasil" size="md" />
              <span className="font-serif text-[1.6rem] font-bold uppercase">BRA</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] text-[var(--color-ink)]">-</button>
              <span className="w-8 text-center font-serif text-[2.2rem] font-bold text-[var(--color-primary)]">0</span>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">+</button>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-gold-soft)] px-4 py-3 font-serif text-[1.35rem] uppercase text-[var(--color-ink)]">
            Guardar pronóstico
          </button>
        </div>
      </div>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-[1.6rem] font-bold uppercase text-[var(--color-ink)]">En vivo</h3>
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-error)] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-error)]" />
            </span>
          </div>
          <span className="text-[14px] font-semibold uppercase text-[var(--color-primary)]">Ver todos</span>
        </div>

        <div className="grid gap-2">
          <div className="relative flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1 bg-[var(--color-error)]" />
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-semibold uppercase">Uruguay</span>
              <span className="text-[14px] uppercase text-[var(--color-muted)]">Colombia</span>
            </div>
            <span className="rounded-full bg-[#ffdad6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#93000a]">78&apos;</span>
            <div className="flex flex-col items-end gap-1">
              <span className="font-serif text-[1.6rem] font-bold text-[var(--color-primary)]">2</span>
              <span className="font-serif text-[1.6rem] font-bold text-[var(--color-muted)]">1</span>
            </div>
          </div>
          <div className="relative flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3">
            <div className="absolute inset-y-0 left-0 w-1 bg-[var(--color-primary-strong)]" />
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-semibold uppercase">Chile</span>
              <span className="text-[14px] uppercase text-[var(--color-muted)]">Perú</span>
            </div>
            <span className="rounded-full bg-[var(--color-line)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-muted)]">HT</span>
            <div className="flex flex-col items-end gap-1">
              <span className="font-serif text-[1.6rem] font-bold">0</span>
              <span className="font-serif text-[1.6rem] font-bold text-[var(--color-muted)]">0</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Abiertos" value="3" detail="Listos" />
          <StatCard label="Cargados" value="0" detail="Tus picks" />
          <StatCard label="Cierran hoy" value="1" detail="Urgente" />
        </div>
        <SurfaceCard title="Fixture inmediato" description="Los próximos cruces se leen rápido, incluso en móvil.">
          <div className="grid gap-4">
            <MatchPlaceholderCard
              stage="Fase de grupos"
              teams="España vs Francia"
              kickoff="Jueves 19 Jun · 17:00"
            />
            <MatchPlaceholderCard
              stage="Fase de grupos"
              teams="México vs Alemania"
              kickoff="Viernes 20 Jun · 22:00"
            />
          </div>
        </SurfaceCard>
      </section>
    </PageStack>
  );
}
