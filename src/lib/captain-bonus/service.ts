import { randomBytes } from "node:crypto";
import {
  buildCaptainBonusCaptainMessage,
  buildCaptainBonusInviteLink,
  buildCaptainBonusTeamInviteLink,
  buildCaptainBonusTeamMessage,
  captainBonusConfig,
  countsForCaptainBonusProgress,
  formatCaptainBonusDeadline,
  resolveCaptainBonusStatus,
} from "@/lib/product/captain-bonus";
import { getPlayerDisplayName } from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { CURRENT_PRIZE_POOL_LABEL } from "@/lib/product/home-display";
import { normalizeWhatsappForLink } from "@/lib/promoters/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const CAPTAIN_BONUS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type CaptainBonusInviteRow = {
  id: string;
  code: string;
  invited_name: string | null;
  invited_phone: string | null;
  status: "pending" | "claimed" | "expired" | "revoked";
  created_by_profile_id: string | null;
  claimed_by_profile_id: string | null;
  claimed_participation_id: string | null;
  claimed_group_id: string | null;
  deadline: string;
  required_members: number;
  created_at: string;
  claimed_at: string | null;
  expired_at: string | null;
  revoked_at: string | null;
  notes: string | null;
};

type ParticipationRow = {
  id: string;
  profile_id: string;
  group_id: string | null;
  promoter_id: string | null;
  payment_status: string;
  payment_source: string | null;
  prize_eligible: boolean | null;
  captain_bonus_completed_at: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  public_alias: string | null;
  whatsapp: string | null;
};

type GroupRow = {
  id: string;
  name: string;
  invite_code: string | null;
  owner_profile_id: string | null;
};

export type AdminCaptainBonusInviteSummary = {
  id: string;
  code: string;
  invitedName: string | null;
  invitedPhone: string | null;
  status: "pending" | "claimed" | "expired" | "revoked";
  createdAt: string;
  deadline: string;
  deadlineLabel: string;
  requiredMembers: number;
  claimedByLabel: string | null;
  claimedGroupName: string | null;
  claimedGroupInviteCode: string | null;
  activeMembers: number | null;
  missingMembers: number | null;
  progressStatus: "pending" | "completed" | "expired" | null;
  captainBonusLink: string;
  captainMessage: string;
  teamInviteLink: string | null;
  teamMessage: string | null;
  teamMessageUnavailableText: string | null;
  whatsappHref: string | null;
  notes: string | null;
};

function isCaptainBonusActiveParticipation(row: Pick<ParticipationRow, "payment_status" | "payment_source"> | null | undefined) {
  return row?.payment_status === "granted" && row.payment_source === "captain_bonus";
}

function buildCaptainBonusCode() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => CAPTAIN_BONUS_CODE_ALPHABET[byte % CAPTAIN_BONUS_CODE_ALPHABET.length]).join("");
}

async function buildUniqueCaptainBonusCode() {
  const service = createServiceRoleSupabaseClient();

  while (true) {
    const candidate = buildCaptainBonusCode();
    const { data: existing } = await service
      .from("captain_bonus_invites")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();

    if (!existing) {
      return candidate;
    }
  }
}

export async function createCaptainBonusInvite(input: {
  adminProfileId: string;
  invitedName: string | null;
  invitedPhone: string | null;
  notes: string | null;
}) {
  const service = createServiceRoleSupabaseClient();
  const code = await buildUniqueCaptainBonusCode();

  const { data, error } = await service
    .from("captain_bonus_invites")
    .insert({
      code,
      invited_name: input.invitedName,
      invited_phone: input.invitedPhone,
      status: "pending",
      created_by_profile_id: input.adminProfileId,
      deadline: captainBonusConfig.deadlineAt,
      required_members: captainBonusConfig.requiredMembers,
      notes: input.notes,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("captain_bonus_invite_create_failed");
  }

  return data as CaptainBonusInviteRow;
}

export async function revokeCaptainBonusInvite(inviteId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data: invite, error: inviteError } = await service
    .from("captain_bonus_invites")
    .select("id, status")
    .eq("id", inviteId)
    .maybeSingle();

  if (inviteError) {
    throw inviteError;
  }

  if (!invite) {
    throw new Error("captain_bonus_not_found");
  }

  if (invite.status !== "pending") {
    throw new Error("captain_bonus_revoke_forbidden");
  }

  const { error } = await service
    .from("captain_bonus_invites")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
    })
    .eq("id", inviteId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }
}

export async function getCaptainBonusInviteByCode(code: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("captain_bonus_invites")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as CaptainBonusInviteRow | null) ?? null;
}

export async function claimCaptainBonusInvite(input: {
  code: string;
  profileId: string;
}) {
  const service = createServiceRoleSupabaseClient();
  const { data: participationRows, error: participationError } = await service
    .from("participations")
    .select("id, profile_id, group_id, promoter_id, payment_status, payment_source, prize_eligible, captain_bonus_completed_at, created_at")
    .eq("profile_id", input.profileId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (participationError) {
    throw participationError;
  }

  const participation = pickPrimaryParticipation((participationRows ?? []) as ParticipationRow[]).participation;

  if (!participation) {
    throw new Error("missing_participation");
  }

  const now = new Date().toISOString();
  const { data, error } = await service.rpc("claim_captain_bonus_invite", {
    p_code: input.code,
    p_profile_id: input.profileId,
    p_participation_id: participation.id,
    p_now: now,
  });

  if (error) {
    throw error;
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    | { result_code?: string | null; invite_id?: string | null; participation_id?: string | null; group_id?: string | null }
    | null;
  const resultCode = result?.result_code ?? null;

  if (resultCode !== "claimed") {
    throw new Error(resultCode ?? "captain_bonus_claim_failed");
  }

  await syncCaptainBonusStateForProfile(input.profileId);

  return {
    inviteId: result?.invite_id ?? null,
    participationId: result?.participation_id ?? participation.id,
    groupId: result?.group_id ?? null,
  };
}

export async function syncCaptainBonusStateForGroup(groupId: string | null | undefined) {
  if (!groupId) {
    return null;
  }

  const service = createServiceRoleSupabaseClient();
  const { data: group, error } = await service
    .from("groups")
    .select("id, owner_profile_id")
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!group?.owner_profile_id) {
    return null;
  }

  return syncCaptainBonusStateForProfile(group.owner_profile_id);
}

export async function syncCaptainBonusStateForProfile(profileId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data: participationRows, error: participationError } = await service
    .from("participations")
    .select("id, profile_id, group_id, promoter_id, payment_status, payment_source, prize_eligible, captain_bonus_completed_at, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (participationError) {
    throw participationError;
  }

  const participation = pickPrimaryParticipation((participationRows ?? []) as ParticipationRow[]).participation;

  if (!participation || !isCaptainBonusActiveParticipation(participation)) {
    return null;
  }

  if (!participation.group_id) {
    await service
      .from("participations")
      .update({
        prize_eligible: false,
        captain_bonus_completed_at: null,
      })
      .eq("id", participation.id);

    if (participation.id) {
      await service
        .from("captain_bonus_invites")
        .update({ claimed_group_id: null })
        .eq("claimed_participation_id", participation.id);
    }

    return {
      status: "pending" as const,
      activeMembers: 1,
      requiredMembers: captainBonusConfig.requiredMembers,
      missingMembers: captainBonusConfig.requiredMembers - 1,
    };
  }

  const { data: groupParticipations, error: groupParticipationsError } = await service
    .from("participations")
    .select("id, profile_id, group_id, payment_status, created_at")
    .eq("group_id", participation.group_id)
    .order("created_at", { ascending: false });

  if (groupParticipationsError) {
    throw groupParticipationsError;
  }

  const byProfile = new Map<string, ParticipationRow[]>();

  for (const row of (groupParticipations ?? []) as ParticipationRow[]) {
    const existing = byProfile.get(row.profile_id) ?? [];
    existing.push(row);
    byProfile.set(row.profile_id, existing);
  }

  const activeMembers = Array.from(byProfile.values())
    .map((rows) => pickPrimaryParticipation(rows).participation)
    .filter((row): row is ParticipationRow => Boolean(row && countsForCaptainBonusProgress(row.payment_status))).length;

  const status = resolveCaptainBonusStatus({ activeMembers });
  const nextPrizeEligible = status.status === "completed";
  const completedAt = nextPrizeEligible ? participation.captain_bonus_completed_at ?? new Date().toISOString() : null;

  await service
    .from("participations")
    .update({
      prize_eligible: nextPrizeEligible,
      captain_bonus_completed_at: completedAt,
    })
    .eq("id", participation.id);

  await service
    .from("captain_bonus_invites")
    .update({
      claimed_group_id: participation.group_id,
    })
    .eq("claimed_participation_id", participation.id);

  return {
    status: status.status,
    activeMembers,
    requiredMembers: status.requiredMembers,
    missingMembers: status.missingMembers,
  };
}

export async function getAdminCaptainBonusInviteSummaries(baseUrl: string) {
  const service = createServiceRoleSupabaseClient();
  const [
    { data: invites, error: invitesError },
    { data: profiles, error: profilesError },
    { data: groups, error: groupsError },
    { data: participations, error: participationsError },
  ] = await Promise.all([
    service.from("captain_bonus_invites").select("*").order("created_at", { ascending: false }),
    service.from("profiles").select("id, full_name, public_alias, whatsapp"),
    service.from("groups").select("id, name, invite_code, owner_profile_id"),
    service.from("participations").select("id, profile_id, group_id, promoter_id, payment_status, payment_source, prize_eligible, captain_bonus_completed_at, created_at"),
  ]);

  if (invitesError) throw invitesError;
  if (profilesError) throw profilesError;
  if (groupsError) throw groupsError;
  if (participationsError) throw participationsError;

  const profileMap = new Map(((profiles ?? []) as ProfileRow[]).map((row) => [row.id, row]));
  const groupMap = new Map(((groups ?? []) as GroupRow[]).map((row) => [row.id, row]));
  const participationsByProfile = new Map<string, ParticipationRow[]>();

  for (const row of (participations ?? []) as ParticipationRow[]) {
    const existing = participationsByProfile.get(row.profile_id) ?? [];
    existing.push(row);
    participationsByProfile.set(row.profile_id, existing);
  }

  const primaryParticipationByProfile = new Map<string, ParticipationRow>();

  for (const [profileId, rows] of participationsByProfile) {
    const primary = pickPrimaryParticipation(rows).participation;
    if (primary) {
      primaryParticipationByProfile.set(profileId, primary);
    }
  }

  const activeMembersByGroup = new Map<string, number>();

  for (const primary of primaryParticipationByProfile.values()) {
    if (!primary.group_id || !countsForCaptainBonusProgress(primary.payment_status)) {
      continue;
    }

    activeMembersByGroup.set(primary.group_id, (activeMembersByGroup.get(primary.group_id) ?? 0) + 1);
  }

  return ((invites ?? []) as CaptainBonusInviteRow[]).map((invite) => {
    const claimedProfile = invite.claimed_by_profile_id ? profileMap.get(invite.claimed_by_profile_id) ?? null : null;
    const claimedGroup = invite.claimed_group_id ? groupMap.get(invite.claimed_group_id) ?? null : null;
    const activeMembers = claimedGroup ? activeMembersByGroup.get(claimedGroup.id) ?? 0 : null;
    const status = activeMembers !== null ? resolveCaptainBonusStatus({ activeMembers, requiredMembers: invite.required_members, deadlineAt: invite.deadline }) : null;
    const captainBonusLink = buildCaptainBonusInviteLink(baseUrl, invite.code);
    const displayName =
      invite.invited_name?.trim() ||
      getPlayerDisplayName(claimedProfile) ||
      "Jugador";
    const captainMessage = buildCaptainBonusCaptainMessage({
      captainBonusLink,
      deadlineLabel: formatCaptainBonusDeadline(invite.deadline),
      missingMembers: status?.missingMembers ?? Math.max(0, invite.required_members - 1),
      name: displayName,
      prizePoolLabel: CURRENT_PRIZE_POOL_LABEL,
    });
    const teamInviteLink =
      claimedGroup?.invite_code ? buildCaptainBonusTeamInviteLink(baseUrl, claimedGroup.invite_code) : null;
    const teamMessage = teamInviteLink
      ? buildCaptainBonusTeamMessage({
          deadlineLabel: formatCaptainBonusDeadline(invite.deadline),
          prizePoolLabel: CURRENT_PRIZE_POOL_LABEL,
          teamInviteLink,
        })
      : null;
    const whatsappDigits = normalizeWhatsappForLink(invite.invited_phone ?? claimedProfile?.whatsapp ?? null);

    return {
      id: invite.id,
      code: invite.code,
      invitedName: invite.invited_name,
      invitedPhone: invite.invited_phone,
      status: invite.status,
      createdAt: invite.created_at,
      deadline: invite.deadline,
      deadlineLabel: formatCaptainBonusDeadline(invite.deadline),
      requiredMembers: invite.required_members,
      claimedByLabel: claimedProfile ? getPlayerDisplayName(claimedProfile) : null,
      claimedGroupName: claimedGroup?.name ?? null,
      claimedGroupInviteCode: claimedGroup?.invite_code ?? null,
      activeMembers,
      missingMembers: status?.missingMembers ?? null,
      progressStatus: status?.status ?? null,
      captainBonusLink,
      captainMessage,
      teamInviteLink,
      teamMessage,
      teamMessageUnavailableText: teamInviteLink ? null : "Disponible cuando el Capitán cree su Team.",
      whatsappHref: whatsappDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(captainMessage)}` : null,
      notes: invite.notes,
    } satisfies AdminCaptainBonusInviteSummary;
  });
}
