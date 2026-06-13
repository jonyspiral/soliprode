import { randomBytes } from "node:crypto";
import { entryConfig } from "@/lib/product/entry-config";
import { rebuildGeneralRankings } from "@/lib/scoring/official-rankings";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import {
  TEAM_PASS_MAX_SLOTS,
  type AdminTeamPassSummary,
  type TeamPassSummary,
} from "@/lib/team-passes/contracts";

const TEAM_PASS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type GroupRow = {
  id: string;
  invite_code: string | null;
  name: string;
  owner_profile_id: string | null;
};

type ParticipationRow = {
  id: string;
  created_at: string;
  payment_status: string;
  profile_id: string;
  group_id: string | null;
};

export type TeamPassRow = {
  id: string;
  team_id: string;
  purchased_by_profile_id: string;
  payment_attempt_id: string;
  total_slots: number;
  used_slots: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TeamInviteRow = {
  id: string;
  team_pass_id: string;
  team_id: string;
  code: string;
  purchased_by_profile_id: string;
  claimed_by_profile_id: string | null;
  claimed_participation_id: string | null;
  status: string;
  created_at: string;
  claimed_at: string | null;
  expires_at: string | null;
};

function buildTeamPassInviteCode() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => TEAM_PASS_CODE_ALPHABET[byte % TEAM_PASS_CODE_ALPHABET.length]).join("");
}

function buildTeamPassInviteUrl(code: string) {
  return `/groups?slot=${encodeURIComponent(code)}`;
}

async function buildUniqueTeamPassInviteCodes(quantity: number) {
  const service = createServiceRoleSupabaseClient();
  const codes: string[] = [];

  while (codes.length < quantity) {
    const candidate = buildTeamPassInviteCode();

    if (codes.includes(candidate)) {
      continue;
    }

    const { data: existing } = await service.from("team_invites").select("id").eq("code", candidate).maybeSingle();

    if (!existing) {
      codes.push(candidate);
    }
  }

  return codes;
}

async function getPrimaryParticipation(profileId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("participations")
    .select("id, created_at, payment_status, profile_id, group_id")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return (
    pickPrimaryParticipation((data ?? []) as ParticipationRow[]).participation ??
    null
  );
}

export async function assertTeamPassPurchaseAccess(input: {
  profileId: string;
  teamId: string;
  slotQuantity: number;
}) {
  if (!Number.isInteger(input.slotQuantity) || input.slotQuantity < 1 || input.slotQuantity > TEAM_PASS_MAX_SLOTS) {
    throw new Error("invalid_team_slot_quantity");
  }

  const service = createServiceRoleSupabaseClient();
  const [{ data: group, error: groupError }, participation] = await Promise.all([
    service
      .from("groups")
      .select("id, name, owner_profile_id, invite_code")
      .eq("id", input.teamId)
      .maybeSingle(),
    getPrimaryParticipation(input.profileId),
  ]);

  if (groupError) {
    throw groupError;
  }

  if (!group) {
    throw new Error("team_not_found");
  }

  if (group.owner_profile_id !== input.profileId) {
    throw new Error("team_pass_forbidden");
  }

  if (!participation) {
    throw new Error("missing_participation");
  }

  if (participation.payment_status !== "paid") {
    throw new Error("team_pass_requires_paid_captain");
  }

  return {
    group: group as GroupRow,
    participation,
  };
}

export async function finalizeApprovedTeamPassPurchase(input: {
  paymentAttemptId: string;
  profileId: string;
  teamId: string;
  slotQuantity: number;
  expiresAt: string | null;
}) {
  const service = createServiceRoleSupabaseClient();

  const { data: existingPass, error: existingPassError } = await service
    .from("team_passes")
    .select("id, team_id, purchased_by_profile_id, payment_attempt_id, total_slots, used_slots, status, created_at, updated_at")
    .eq("payment_attempt_id", input.paymentAttemptId)
    .maybeSingle();

  if (existingPassError) {
    throw existingPassError;
  }

  if (existingPass) {
    await refreshTeamPassUsage(existingPass.id);
    return existingPass as TeamPassRow;
  }

  const { data: insertedPass, error: insertPassError } = await service
    .from("team_passes")
    .insert({
      team_id: input.teamId,
      purchased_by_profile_id: input.profileId,
      payment_attempt_id: input.paymentAttemptId,
      total_slots: input.slotQuantity,
      used_slots: 0,
      status: "paid",
    })
    .select("id, team_id, purchased_by_profile_id, payment_attempt_id, total_slots, used_slots, status, created_at, updated_at")
    .single();

  if (insertPassError || !insertedPass) {
    throw insertPassError ?? new Error("team_pass_insert_failed");
  }

  const codes = await buildUniqueTeamPassInviteCodes(input.slotQuantity);
  const inviteRows = codes.map((code) => ({
    team_pass_id: insertedPass.id,
    team_id: input.teamId,
    code,
    purchased_by_profile_id: input.profileId,
    status: "pending",
    expires_at: input.expiresAt,
  }));

  const { error: insertInvitesError } = await service.from("team_invites").insert(inviteRows);

  if (insertInvitesError) {
    throw insertInvitesError;
  }

  return insertedPass as TeamPassRow;
}

export async function refreshTeamPassUsage(teamPassId: string) {
  const service = createServiceRoleSupabaseClient();
  const [{ data: teamPass, error: teamPassError }, { data: invites, error: invitesError }] = await Promise.all([
    service
      .from("team_passes")
      .select("id, total_slots")
      .eq("id", teamPassId)
      .maybeSingle(),
    service
      .from("team_invites")
      .select("id, status")
      .eq("team_pass_id", teamPassId),
  ]);

  if (teamPassError) {
    throw teamPassError;
  }

  if (invitesError) {
    throw invitesError;
  }

  if (!teamPass) {
    return null;
  }

  const usedSlots = ((invites ?? []) as Array<{ id: string; status: string }>).filter((invite) => invite.status === "claimed").length;
  const totalSlots = Number(teamPass.total_slots ?? 0);
  const status =
    usedSlots <= 0
      ? "paid"
      : usedSlots >= totalSlots
        ? "claimed"
        : "partially_claimed";

  const { data: updatedPass, error: updateError } = await service
    .from("team_passes")
    .update({
      used_slots: usedSlots,
      status,
    })
    .eq("id", teamPassId)
    .select("id, team_id, purchased_by_profile_id, payment_attempt_id, total_slots, used_slots, status, created_at, updated_at")
    .single();

  if (updateError || !updatedPass) {
    throw updateError ?? new Error("team_pass_update_failed");
  }

  return updatedPass as TeamPassRow;
}

export async function getTeamPassSummaryForGroup(input: {
  teamId: string;
  activePlayers: number;
}) {
  const service = createServiceRoleSupabaseClient();
  const [{ data: passes, error: passesError }, { data: invites, error: invitesError }] = await Promise.all([
    service
      .from("team_passes")
      .select("id, team_id, purchased_by_profile_id, payment_attempt_id, total_slots, used_slots, status, created_at, updated_at")
      .eq("team_id", input.teamId)
      .order("created_at", { ascending: false }),
    service
      .from("team_invites")
      .select("id, team_pass_id, team_id, code, purchased_by_profile_id, claimed_by_profile_id, claimed_participation_id, status, created_at, claimed_at, expires_at")
      .eq("team_id", input.teamId)
      .order("created_at", { ascending: false }),
  ]);

  if (passesError) {
    throw passesError;
  }

  if (invitesError) {
    throw invitesError;
  }

  const passRows = (passes ?? []) as TeamPassRow[];
  const inviteRows = (invites ?? []) as TeamInviteRow[];
  const totalSlots = passRows.reduce((sum, pass) => sum + Number(pass.total_slots ?? 0), 0);
  const usedSlots = inviteRows.filter((invite) => invite.status === "claimed").length;
  const pendingSlots = inviteRows.filter((invite) => invite.status === "pending").length;

  return {
    teamId: input.teamId,
    totalSlots,
    usedSlots,
    pendingSlots,
    activePlayers: input.activePlayers,
    invites: inviteRows.map((invite) => ({
      id: invite.id,
      code: invite.code,
      status: (invite.status as "pending" | "claimed" | "expired") ?? "pending",
      claimedByProfileId: invite.claimed_by_profile_id,
      claimedAt: invite.claimed_at,
      inviteUrl: buildTeamPassInviteUrl(invite.code),
    })),
  } satisfies TeamPassSummary;
}

export async function getTeamPassInviteByCode(code: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("team_invites")
    .select("id, team_pass_id, team_id, code, purchased_by_profile_id, claimed_by_profile_id, claimed_participation_id, status, created_at, claimed_at, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as TeamInviteRow | null) ?? null;
}

export async function claimTeamPassInvite(input: {
  code: string;
  profileId: string;
}) {
  const service = createServiceRoleSupabaseClient();
  const participation = await getPrimaryParticipation(input.profileId);

  if (!participation) {
    throw new Error("missing_participation");
  }
  const now = new Date().toISOString();

  const { data, error } = await service.rpc("claim_team_pass_invite", {
    p_code: input.code,
    p_profile_id: input.profileId,
    p_participation_id: participation.id,
    p_now: now,
  });

  if (error) {
    throw error;
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    | {
        result_code?: string | null;
        invite_id?: string | null;
        team_id?: string | null;
        participation_id?: string | null;
      }
    | null;
  const resultCode =
    result && typeof result.result_code === "string" ? result.result_code : null;

  if (!resultCode || resultCode !== "claimed") {
    throw new Error(resultCode ?? "team_invite_claim_failed");
  }

  await rebuildGeneralRankings();

  return {
    inviteId: typeof result?.invite_id === "string" ? result.invite_id : "",
    teamId: typeof result?.team_id === "string" ? result.team_id : "",
    participationId: typeof result?.participation_id === "string" ? result.participation_id : participation.id,
  };
}

export async function getAdminTeamPassSummaries(limit = 20) {
  const service = createServiceRoleSupabaseClient();
  const [
    { data: passRows, error: passError },
    { data: groupRows, error: groupError },
    { data: profileRows, error: profileError },
    { data: inviteRows, error: inviteError },
    { data: activeParticipationRows, error: activeParticipationError },
  ] =
    await Promise.all([
      service
        .from("team_passes")
        .select("id, team_id, purchased_by_profile_id, payment_attempt_id, total_slots, used_slots, status, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      service
        .from("groups")
        .select("id, name, owner_profile_id, invite_code"),
      service
        .from("profiles")
        .select("id, public_alias, full_name"),
      service
        .from("team_invites")
        .select("id, team_pass_id, team_id, code, purchased_by_profile_id, claimed_by_profile_id, claimed_participation_id, status, created_at, claimed_at, expires_at")
        .order("created_at", { ascending: false }),
      service
        .from("participations")
        .select("group_id")
        .eq("payment_status", "paid"),
    ]);

  if (passError) {
    throw passError;
  }

  if (groupError) {
    throw groupError;
  }

  if (profileError) {
    throw profileError;
  }

  if (inviteError) {
    throw inviteError;
  }

  if (activeParticipationError) {
    throw activeParticipationError;
  }

  const groups = new Map(((groupRows ?? []) as GroupRow[]).map((row) => [row.id, row]));
  const profiles = new Map(
    ((profileRows ?? []) as Array<{ id: string; public_alias: string | null; full_name: string | null }>).map((row) => [
      row.id,
      row.public_alias?.trim() || row.full_name?.trim() || "Capitán",
    ]),
  );
  const activePlayersByTeam = new Map<string, number>();
  const invitesByPassId = new Map<string, TeamInviteRow[]>();

  for (const participation of (activeParticipationRows ?? []) as Array<{ group_id: string | null }>) {
    if (!participation.group_id) {
      continue;
    }

    activePlayersByTeam.set(participation.group_id, (activePlayersByTeam.get(participation.group_id) ?? 0) + 1);
  }

  for (const invite of (inviteRows ?? []) as TeamInviteRow[]) {
    const existing = invitesByPassId.get(invite.team_pass_id) ?? [];
    existing.push(invite);
    invitesByPassId.set(invite.team_pass_id, existing);
  }

  return ((passRows ?? []) as TeamPassRow[]).map((pass) => ({
    id: pass.id,
    teamId: pass.team_id,
    teamName: groups.get(pass.team_id)?.name ?? "Team",
    purchasedByProfileId: pass.purchased_by_profile_id,
    purchasedByLabel: profiles.get(pass.purchased_by_profile_id) ?? "Capitán",
    activePlayers: activePlayersByTeam.get(pass.team_id) ?? 0,
    totalSlots: Number(pass.total_slots ?? 0),
    usedSlots: Number(pass.used_slots ?? 0),
    pendingSlots: Math.max(0, Number(pass.total_slots ?? 0) - Number(pass.used_slots ?? 0)),
    status: pass.status,
    createdAt: pass.created_at,
    invites: (invitesByPassId.get(pass.id) ?? []).map((invite) => ({
      id: invite.id,
      code: invite.code,
      status: (invite.status as "pending" | "claimed" | "expired") ?? "pending",
      inviteUrl: buildTeamPassInviteUrl(invite.code),
      claimedByProfileId: invite.claimed_by_profile_id,
      claimedAt: invite.claimed_at,
    })),
  })) satisfies AdminTeamPassSummary[];
}

export async function buildTeamPassAmount(slotQuantity: number) {
  if (!Number.isInteger(slotQuantity) || slotQuantity < 1 || slotQuantity > TEAM_PASS_MAX_SLOTS) {
    throw new Error("invalid_team_slot_quantity");
  }

  return entryConfig.initialPrice * slotQuantity;
}
