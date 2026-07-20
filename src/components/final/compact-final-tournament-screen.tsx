import { FinalTournamentScreen } from "@/components/final/final-tournament-screen";

export function CompactFinalTournamentScreen() {
  return (
    <div className="compact-final-tournament-screen">
      <style>{`
        .compact-final-tournament-screen #final-top-ten-title {
          font-size: 0;
        }

        .compact-final-tournament-screen #final-top-ten-title::after {
          content: "Top 5 individual";
          font-size: 2.25rem;
          line-height: 1;
        }

        .compact-final-tournament-screen section[aria-labelledby="final-top-ten-title"] > div:last-child > article:nth-child(n + 6) {
          display: none;
        }

        @media (min-width: 640px) {
          .compact-final-tournament-screen #final-top-ten-title::after {
            font-size: 2.25rem;
          }
        }
      `}</style>
      <FinalTournamentScreen />
    </div>
  );
}
