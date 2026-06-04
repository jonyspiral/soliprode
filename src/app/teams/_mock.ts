export type TeamMember = {
  id: string;
  avatarUrl?: string | null;
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
  dtAvatarUrl?: string | null;
  name: string;
  points: number;
  position: number;
  isCurrentTeam?: boolean;
};
