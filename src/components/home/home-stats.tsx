type HomeStatsProps = {
  prizePoolLabel: string;
  playersLabel: string;
};

export function HomeStats({ prizePoolLabel, playersLabel }: HomeStatsProps) {
  return (
    <section className="home-landing-stats">
      <article className="home-landing-stat-card">
        <p className="home-landing-stat-label">Pozo inicial</p>
        <p className="home-landing-stat-value">{prizePoolLabel}</p>
      </article>
      <article className="home-landing-stat-card">
        <p className="home-landing-stat-label">Jugadores</p>
        <p className="home-landing-stat-value">{playersLabel}</p>
      </article>
    </section>
  );
}
