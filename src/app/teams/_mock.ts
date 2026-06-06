export type TeamMember = {
  id: string;
  avatarSeed?: string | null;
  avatarUrl?: string | null;
  avatarVariant?: string | null;
  fallbackAvatarUrl?: string | null;
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
  avatarSeed?: string | null;
  avatarUrl?: string | null;
  avatarVariant?: string | null;
  fallbackAvatarUrl?: string | null;
  dtAvatarUrl?: string | null;
  name: string;
  points: number;
  position: number;
  isCurrentTeam?: boolean;
};
