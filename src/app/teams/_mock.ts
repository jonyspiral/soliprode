export type TeamMember = {
  id: string;
  name: string;
  roleLabel: string;
  points: number;
  status: "captain" | "dt" | "starter" | "bench" | "registered";
  accent: string;
  note?: string;
  isCaptain?: boolean;
  isDt?: boolean;
};

export type TeamRankingEntry = {
  name: string;
  points: number;
  position: number;
  isCurrentTeam?: boolean;
};
