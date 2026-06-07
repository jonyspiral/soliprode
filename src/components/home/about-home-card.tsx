import Link from "next/link";

type AboutHomeCardProps = {
  href?: string;
};

export function AboutHomeCard({ href = "/quienes-somos" }: AboutHomeCardProps) {
  return (
    <article className="home-about-card">
      <span className="home-about-card-tag">Quiénes somos</span>
      <h3 className="home-about-card-title">Hay una causa real detrás del juego.</h3>
      <p className="home-about-card-copy">
        SoliProde ayuda a estudiantes universitarios a financiar su tesis final.
      </p>
      <Link href={href} className="home-about-card-link">
        Ver la historia →
      </Link>
    </article>
  );
}
