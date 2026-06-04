export type HomeRankingEntry = {
  label: string;
  points: number;
  position: number;
  detail?: string;
};

type HomeRankingListProps = {
  title: string;
  description: string;
  entries: HomeRankingEntry[];
  emptyMessage: string;
  tone?: "individual" | "group";
};

export function HomeRankingList({
  title,
  description,
  entries,
  emptyMessage,
  tone = "individual",
}: HomeRankingListProps) {
  const isGroup = tone === "group";

  return (
    <section className="home-landing-surface">
      <div className="home-landing-section-header">
        <h2 className="home-landing-section-title">{title}</h2>
        <p className="home-landing-section-copy">{description}</p>
      </div>

      {entries.length > 0 ? (
        <div className="home-ranking-list">
          {entries.map((entry) => (
            <article key={`${entry.position}-${entry.label}`} className="home-ranking-row">
              <span
                className={[
                  "home-ranking-position",
                  entry.position === 1
                    ? "home-ranking-position-gold"
                    : isGroup
                      ? "home-ranking-position-group"
                      : "",
                ].join(" ")}
              >
                #{entry.position}
              </span>

              <div className="home-ranking-copy">
                <h3 className="home-ranking-label">{entry.label}</h3>
                {entry.detail ? <p className="home-ranking-detail">{entry.detail}</p> : null}
              </div>

              <p className="home-ranking-points">{entry.points.toLocaleString("es-AR")} pts</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="home-ranking-empty">
          <p>{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}
