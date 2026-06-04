import Image from "next/image";
import Link from "next/link";
import { HomePromoPanel } from "@/components/home/home-promo-panel";
import type { HomeHeroState } from "@/lib/home/player-hero-state";

type HomeHeroProps = {
  entryPrice: string;
  state: HomeHeroState;
};

export function HomeHero({ entryPrice, state }: HomeHeroProps) {
  const isGuest = state.kind === "guest";
  const isRegistered = state.kind === "registered";
  const isActive = state.kind === "active";
  const heroTitle = isActive
    ? `Hola${state.alias ? `, ${state.alias}` : ""}`
    : isRegistered
      ? "Ya podés activar tu juego"
      : "¡Jugá el Mundial y llevate todo!";
  const heroCopy = isActive
    ? "Ya estás compitiendo. Mirá tu score y cómo viene tu Team."
    : isRegistered
      ? "Tus pronósticos quedan guardados. Activá tu Pase Solidario para entrar a competir."
      : "Y de paso, bancás a un grupo de universitarios a terminar su carrera.";
  const heroHighlight = isActive
    ? null
    : isRegistered
      ? null
      : "Jugás un Prode Mundial… para ser campeón, tenés que sumar. Creá equipo con 11 amigos y competí por la Copa SoliProde.";

  return (
    <section className="home-landing-hero">
      <div className="home-landing-hero-media">
        <Image
          src="/lio_copa.jpeg"
          alt="Jugador con la Copa del Mundo"
          fill
          priority
          unoptimized
          className="object-cover object-[55%_18%]"
          sizes="100vw"
        />
        <div className="home-landing-hero-overlay" />
        <div className="home-landing-hero-inner">
          <p className="home-landing-kicker">{isGuest ? "¡Ayuda y gana!" : isActive ? state.statusLabel : "Registrado"}</p>
          <h1 className="home-landing-title">{heroTitle}</h1>
          <p className="home-landing-copy">{heroCopy}</p>
          {heroHighlight ? (
            <p className="home-landing-highlight">
              {isGuest ? (
                <>
                  Jugás un Prode Mundial… para ser campeón, tenés que sumar.{" "}
                  <strong>Creá equipo con 11 amigos</strong> y competí por la <strong>Copa SoliProde.</strong>
                </>
              ) : (
                heroHighlight
              )}
            </p>
          ) : null}
          {isGuest ? (
            <div className="home-landing-actions">
              <Link href={state.primaryAction.href} className="home-landing-button-primary">
                {state.primaryAction.label}
              </Link>
              <Link href={state.secondaryAction.href} className="home-landing-button-secondary">
                {state.secondaryAction.label}
              </Link>
            </div>
          ) : null}
          {isActive ? (
            <div className="home-landing-summary-grid">
              {state.metrics.map((metric) => (
                <article key={metric.label} className="home-landing-summary-card">
                  <p className="home-landing-summary-label">{metric.label}</p>
                  <p className="home-landing-summary-value">{metric.value}</p>
                  <p className="home-landing-summary-copy">{metric.detail}</p>
                </article>
              ))}
            </div>
          ) : (
            <HomePromoPanel entryPrice={entryPrice} clickable={isRegistered} />
          )}
        </div>
      </div>
    </section>
  );
}
