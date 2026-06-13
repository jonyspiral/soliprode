import { getTeamScoringMaxPlayers } from "@/lib/competition/settings";

export const TEAM_PASS_MAX_SLOTS = getTeamScoringMaxPlayers();

export type TeamPassSummary = {
  teamId: string;
  totalSlots: number;
  usedSlots: number;
  pendingSlots: number;
  activePlayers: number;
  invites: Array<{
    id: string;
    code: string;
    status: "pending" | "claimed" | "expired";
    claimedByProfileId: string | null;
    claimedAt: string | null;
    inviteUrl: string;
  }>;
};

export type AdminTeamPassSummary = {
  id: string;
  teamId: string;
  teamName: string;
  purchasedByProfileId: string;
  purchasedByLabel: string;
  totalSlots: number;
  usedSlots: number;
  pendingSlots: number;
  status: string;
  createdAt: string;
};
