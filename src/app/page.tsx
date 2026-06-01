import Link from "next/link";
import { PageHero } from "@/components/page-hero";

const landingSections = [
  {
    title: "Qué es SoliProde",
    body: "Una experiencia simple para vivir el Mundial con pronósticos entre amigos, equipos y comunidades, con un objetivo solidario concreto detrás.",
  },
  {
    title: "Cómo se juega",
    body: "Cada participante completa sus predicciones partido a partido, suma puntos por aciertos y sigue su rendimiento desde un panel claro y rápido.",
  },
  {
    title: "Competencia individual",
    body: "Cada usuario ve su progreso, aciertos, próximos desafíos y evolución durante el torneo desde una interfaz pensada primero para móvil.",
  },
  {
    title: "Grupos y oficinas",
    body: "Equipos de trabajo, comunidades y grupos de amigos podrán competir en rankings propios sin perder la tabla general del torneo.",
  },
  {
    title: "Ranking solidario",
    body: "El juego acompaña una causa concreta: ayudar a financiar una tesis mientras se genera participación, seguimiento y comunidad.",
  },
  {
    title: "Próximamente",
    body: "Login real, resultados automáticos, comunidades avanzadas, tablero admin y futura integración con Supabase para persistencia y gestión.",
  },
];

const quickLinks = [
  { href: "/dashboard", label: "Ver dashboard" },
  { href: "/matches", label: "Explorar partidos" },
  { href: "/rankings", label: "Abrir rankings" },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-6 pb-24 sm:gap-8 sm:pb-0">
      <PageHero
        title="Jugá el Mundial, competí con tu grupo y ayudá a financiar una tesis."
        description="SoliProde es la base del Prode Mundial Solidario 2026: una PWA mobile-first preparada para crecer con autenticación, comunidades y rankings en tiempo real."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Empezar
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Ver estructura base
          </Link>
        </div>
      </PageHero>

      <section className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <article className="rounded-[2rem] border border-[var(--color-line)] bg-[linear-gradient(135deg,#0f172a_0%,#1e3a5f_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-sm uppercase tracking-[0.16em] text-sky-200">
            SoliProde
          </p>
          <h2 className="mt-3 font-serif text-2xl leading-tight sm:text-4xl">
            Base lista para crecer sobre App Router y desplegar en Vercel.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
            Esta versión inicial prioriza estructura, navegación y consistencia
            visual para que la siguiente etapa incorpore autenticación,
            persistencia y reglas del juego sin rehacer la base.
          </p>
        </article>

        <aside className="rounded-[2rem] border border-[var(--color-line)] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            Accesos rápidos
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-[var(--color-line)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {landingSections.map((section) => (
          <article
            key={section.title}
            className="rounded-[1.75rem] border border-[var(--color-line)] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)]"
          >
            <h2 className="font-serif text-2xl text-[var(--color-ink)]">
              {section.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              {section.body}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
