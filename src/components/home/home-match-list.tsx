import { CountryFlag } from "@/components/country-flag";

export type HomeLandingMatch = {
  group: string;
  kickoff: string;
  home: {
    code: string;
    name: string;
    countryCode: string | null;
  };
  away: {
    code: string;
    name: string;
    countryCode: string | null;
  };
};

type HomeMatchListProps = {
  matches: HomeLandingMatch[];
};

export function HomeMatchList({ matches }: HomeMatchListProps) {
  return (
    <section className="home-landing-surface">
      <div className="home-landing-section-header">
        <h2 className="home-landing-section-title">Próximos partidos</h2>
        <p className="home-landing-section-copy">
          Estos son los primeros cruces para cargar tu pronóstico.
        </p>
      </div>
      <div className="home-landing-match-list">
        {matches.map((match, index) => (
          <div
            key={`${match.home.code}-${match.away.code}-${index}`}
            className="home-landing-match-row"
          >
            <div className="home-landing-match-teams">
              <CountryFlag
                country={match.home.name}
                countryCode={match.home.countryCode}
                label={match.home.name}
                size="sm"
                className="h-9 w-9 text-lg"
              />
              <span className="home-landing-match-code">{match.home.code}</span>
              <span className="home-landing-match-versus">vs</span>
              <span className="home-landing-match-code">{match.away.code}</span>
              <CountryFlag
                country={match.away.name}
                countryCode={match.away.countryCode}
                label={match.away.name}
                size="sm"
                className="h-9 w-9 text-lg"
              />
            </div>
            <div className="home-landing-match-meta">
              <p className="home-landing-match-stage">Grupo {match.group}</p>
              <p className="home-landing-match-kickoff">{match.kickoff}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
