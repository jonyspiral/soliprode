import Image from "next/image";
import Link from "next/link";
import { HomePromoPanel } from "@/components/home/home-promo-panel";

type HomeHeroAction = {
  href: string;
  label: string;
};

type HomeHeroProps = {
  entryPrice: string;
  primaryAction: HomeHeroAction;
  secondaryAction: HomeHeroAction;
};

export function HomeHero({ entryPrice, primaryAction, secondaryAction }: HomeHeroProps) {
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
          <p className="home-landing-kicker">¡Ayuda y gana!</p>
          <h1 className="home-landing-title">¡Jugá el Mundial y llevate todo!</h1>
          <p className="home-landing-copy">
            Y de paso, bancás a un grupo de universitarios a terminar su carrera.
          </p>
          <p className="home-landing-highlight">
            Jugás un Prode Mundial… para ser campeón, tenés que sumar.{" "}
            <strong>Creá equipo con 11 amigos</strong> y competí por la <strong>Copa SoliProde.</strong>
          </p>
          <div className="home-landing-actions">
            <Link href={primaryAction.href} className="home-landing-button-primary">
              {primaryAction.label}
            </Link>
            <Link href={secondaryAction.href} className="home-landing-button-secondary">
              {secondaryAction.label}
            </Link>
          </div>
          <HomePromoPanel entryPrice={entryPrice} />
        </div>
      </div>
    </section>
  );
}
