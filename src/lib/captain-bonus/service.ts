import { randomBytes } from "node:crypto";
import {
  buildCaptainBonusCampaignLink,
  buildCaptainBonusCampaignMessage,
  captainBonusConfig,
  countsForCaptainBonusProgress,
  resolveCaptainBonusStatus,
} from "@/lib/product/captain-bonus";
import { getPlayerDisplayName } from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const CAPTAIN_BONUS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type CaptainBonusCampaignRow = {
  id: string;
  code: string;
  name: string;
  total_slots: number;
  claimed_slots: number;
  status: "active" | "exhausted" | "expired" | "cancelled";
  created_by_profile_id: string | null;
  expires_at: string | null;
  created_at: string;
  cancelled_at: string | null;
  notes: string | null;
};

type CaptainBonusCampaignClaimRow = {
  id: string;
  campaign_id: string;
  profile_id: string;
  participation_id: string;
  group_id: string | null;
  claimed_at: string;
};

type ParticipationRow = {
  id: string;
  profile_id: string;
  group_id: string | null;
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
};

type GroupRow = {
  id: string;
  invite_code: string | null;
  name: string;
  owner_profile_id: string | null;
};

export type AdminCaptainBonusCampaignClaimSummary = {
  claimedAt: string;
  claimedAtLabel: string;
  claimedByLabel: string;
  groupName: string | null;
  groupInviteCode: string | null;
  progressStatus: "pending" | "completed" | "expired" | null;
};

export type AdminCaptainBonusCampaignSummary = {
  availableSlots: number;
  claimUrl: string;
  code: string;
  createdAt: string;
  createdAtLabel: string;
  expiresAt: string | null;
  expiresAtLabel: string | null;
  id: string;
  inviteMessage: string;
  name: string;
  notes: string | null;
  claimedSlots: number;
  claims: AdminCaptainBonusCampaignClaimSummary[];
  status: "active" | "exhausted" | "expired" | "cancelled";
  totalSlots: number;
  whatsappHref: string;
};

function buildCaptainBonusCode() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => CAPTAIN_BONUS_CODE_ALPHABET[byte % CAPTAIN_BONUS_CODE_ALPHABET.length]).join("");
}

async function buildUniqueCaptainBonusCode() {
  const service = createServiceRoleSupabaseClient();

  while (true) {
    const candidate = buildCaptainBonusCode();
    const { data: existing } = await service
      .from("captain_bonus_campaigns")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();

    if (!existing) {
      return candidate;
    }
  }
}

function isCaptainBonusActiveParticipation(
  row: Pick<ParticipationRow, "payment_status" | "payment_source"> | null | undefined,
) {
  return row?.payment_status === "granted" && row.payment_source === "captain_bonus";
}

function normalizeCampaignStatus(campaign: Pick<CaptainBonusCampaignRow, "status" | "claimed_slots" | "total_slots" | "expires_at">) {
  if (campaign.status === "cancelled") {
    return "cancelled" as const;
  }

  if (campaign.expires_at && new Date(campaign.expires_at).getTime() <= Date.now()) {
    return "expired" as const;
  }

  if (campaign.claimed_slots >= campaign.total_slots || campaign.status === "exhausted") {
    return "exhausted" as const;
  }

  return "active" as const;
}

function formatAdminDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export async function createCaptainBonusCampaign(input: {
  adminProfileId: string;
  expiresAt: string | null;
  name: string;
  notes: string | null;
  totalSlots: number;
}) {
  const service = createServiceRoleSupabaseClient();
  const code = await buildUniqueCaptainBonusCode();

  const { data, error } = await service
    .from("captain_bonus_campaigns")
    .insert({
      code,
      name: input.name,
      total_slots: input.totalSlots,
      claimed_slots: 0,
      status: "active",
      created_by_profile_id: input.adminProfileId,
      expires_at: input.expiresAt,
      notes: input.notes,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("captain_bonus_campaign_create_failed");
  }

  return data as CaptainBonusCampaignRow;
}

export async function cancelCaptainBonusCampaign(campaignId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data: campaign, error: campaignError } = await service
    .from("captain_bonus_campaigns")
    .select("id, status")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    throw campaignError;
  }

  if (!campaign) {
    throw new Error("captain_bonus_not_found");
  }

  if (campaign.status === "cancelled") {
    return;
  }

  const { error } = await service
    .from("captain_bonus_campaigns")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  if (error) {
    throw error;
  }
}

export async function getCaptainBonusCampaignByCode(code: string) {
  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("captain_bonus_campaigns")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as CaptainBonusCampaignRow | null) ?? null;
}

export async function claimCaptainBonusCampaign(input: {
  code: string;
  profileId: string;
}) {
  const service = createServiceRoleSupabaseClient();
  const { data: participationRows, error: participationError } = await service
    .from("participations")
    .select("id, profile_id, group_id, payment_status, payment_source, prize_eligible, captain_bonus_completed_at, created_at")
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

  const { data, error } = await service.rpc("claim_captain_bonus_campaign", {
    p_code: input.code,
    p_profile_id: input.profileId,
    p_participation_id: participation.id,
    p_now: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  const result = (Array.isArray(data) ? data[0] : data) as
    | { campaign_id?: string | null; group_id?: string | null; participation_id?: string | null; result_code?: string | null }
    | null;
  const resultCode = result?.result_code ?? null;

  if (resultCode !== "claimed") {
    throw new Error(resultCode ?? "captain_bonus_claim_failed");
  }

  await syncCaptainBonusStateForProfile(input.profileId);

  return {
    campaignId: result?.campaign_id ?? null,
    groupId: result?.group_id ?? null,
    participationId: result?.participation_id ?? participation.id,
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
    .select("id, profile_id, group_id, payment_status, payment_source, prize_eligible, captain_bonus_completed_at, created_at")
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

    await service
      .from("captain_bonus_campaign_claims")
      .update({ group_id: null })
      .eq("participation_id", participation.id);

    return {
      activeMembers: 1,
      missingMembers: captainBonusConfig.requiredMembers - 1,
      requiredMembers: captainBonusConfig.requiredMembers,
      status: "pending" as const,
    };
  }

  const { data: groupParticipations, error: groupParticipationsError } = await service
    .from("participations")
    .select("id, profile_id, group_id, payment_status, payment_source, created_at")
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
    .from("captain_bonus_campaign_claims")
    .update({ group_id: participation.group_id })
    .eq("participation_id", participation.id);

  return {
    activeMembers,
    missingMembers: status.missingMembers,
    requiredMembers: status.requiredMembers,
    status: status.status,
  };
}

export async function getAdminCaptainBonusCampaignSummaries(baseUrl: string) {
  const service = createServiceRoleSupabaseClient();
  const [
    { data: campaignRows, error: campaignError },
    { data: claimRows, error: claimError },
    { data: profileRows, error: profileError },
    { data: groupRows, error: groupError },
    { data: participationRows, error: participationError },
  ] = await Promise.all([
    service.from("captain_bonus_campaigns").select("*").order("created_at", { ascending: false }),
    service.from("captain_bonus_campaign_claims").select("*").order("claimed_at", { ascending: false }),
    service.from("profiles").select("id, full_name, public_alias"),
    service.from("groups").select("id, name, invite_code, owner_profile_id"),
    service.from("participations").select("id, profile_id, group_id, payment_status, payment_source, prize_eligible, captain_bonus_completed_at, created_at"),
  ]);

  if (campaignError) throw campaignError;
  if (claimError) throw claimError;
  if (profileError) throw profileError;
  if (groupError) throw groupError;
  if (participationError) throw participationError;

  const profiles = new Map(((profileRows ?? []) as ProfileRow[]).map((row) => [row.id, row]));
  const groups = new Map(((groupRows ?? []) as GroupRow[]).map((row) => [row.id, row]));
  const claimsByCampaign = new Map<string, CaptainBonusCampaignClaimRow[]>();
  const participationsByProfile = new Map<string, ParticipationRow[]>();

  for (const row of (claimRows ?? []) as CaptainBonusCampaignClaimRow[]) {
    const existing = claimsByCampaign.get(row.campaign_id) ?? [];
    existing.push(row);
    claimsByCampaign.set(row.campaign_id, existing);
  }

  for (const row of (participationRows ?? []) as ParticipationRow[]) {
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

  return ((campaignRows ?? []) as CaptainBonusCampaignRow[]).map((campaign) => {
    const claimUrl = buildCaptainBonusCampaignLink(baseUrl, campaign.code);
    const inviteMessage = buildCaptainBonusCampaignMessage({ claimUrl });
    const claims = (claimsByCampaign.get(campaign.id) ?? []).map((claim) => {
      const claimedProfile = profiles.get(claim.profile_id) ?? null;
      const claimedGroup = claim.group_id ? groups.get(claim.group_id) ?? null : null;
      const activeMembers = claimedGroup ? activeMembersByGroup.get(claimedGroup.id) ?? 0 : null;
      const progressStatus =
        activeMembers !== null
          ? resolveCaptainBonusStatus({ activeMembers, requiredMembers: captainBonusConfig.requiredMembers }).status
          : null;

      return {
        claimedAt: claim.claimed_at,
        claimedAtLabel: formatAdminDateTime(claim.claimed_at) ?? claim.claimed_at,
        claimedByLabel: claimedProfile ? getPlayerDisplayName(claimedProfile) : "Capitán",
        groupName: claimedGroup?.name ?? null,
        groupInviteCode: claimedGroup?.invite_code ?? null,
        progressStatus,
      } satisfies AdminCaptainBonusCampaignClaimSummary;
    });

    const status = normalizeCampaignStatus(campaign);
    const claimedSlots = claims.length;
    const availableSlots = Math.max(0, campaign.total_slots - claimedSlots);

    return {
      availableSlots,
      claimUrl,
      code: campaign.code,
      createdAt: campaign.created_at,
      createdAtLabel: formatAdminDateTime(campaign.created_at) ?? campaign.created_at,
      expiresAt: campaign.expires_at,
      expiresAtLabel: formatAdminDateTime(campaign.expires_at),
      id: campaign.id,
      inviteMessage,
      name: campaign.name,
      notes: campaign.notes,
      claimedSlots,
      claims,
      status,
      totalSlots: campaign.total_slots,
      whatsappHref: `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`,
    } satisfies AdminCaptainBonusCampaignSummary;
  });
}
