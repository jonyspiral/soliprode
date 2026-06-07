import { normalizePromoterCode } from "@/lib/auth/promoter-attribution";
import { normalizeInviteCode } from "@/lib/groups/competition";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type ResolvedPromoterInvite = {
  id: string;
  code: string;
  name: string;
};

export type ResolvedGroupInvite = {
  id: string;
  code: string;
  name: string;
  ownerProfileId: string | null;
  fallbackPromoter: ResolvedPromoterInvite | null;
};

export async function resolvePromoterInvite(
  rawPromoterCode: string | null | undefined,
): Promise<ResolvedPromoterInvite | null> {
  const promoterCode = normalizePromoterCode(rawPromoterCode);

  if (!promoterCode) {
    return null;
  }

  const service = createServiceRoleSupabaseClient();
  const { data: promoter } = await service
    .from("promoters")
    .select("id, code, name, status, active")
    .eq("code", promoterCode)
    .maybeSingle();

  if (!promoter) {
    return null;
  }

  const isActive = promoter.status === "active" || (promoter.status == null && promoter.active === true);

  if (!isActive) {
    return null;
  }

  return {
    id: promoter.id,
    code: promoter.code,
    name: promoter.name,
  };
}

export async function resolveGroupInvite(
  rawGroupInviteCode: string | null | undefined,
): Promise<ResolvedGroupInvite | null> {
  const inviteCode = normalizeInviteCode(rawGroupInviteCode ?? "");

  if (!inviteCode) {
    return null;
  }

  const service = createServiceRoleSupabaseClient();
  const { data: group } = await service
    .from("groups")
    .select("id, name, invite_code, owner_profile_id")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!group) {
    return null;
  }

  let fallbackPromoter: ResolvedPromoterInvite | null = null;

  if (group.owner_profile_id) {
    const { data: promoter } = await service
      .from("promoters")
      .select("id, code, name, status, active")
      .eq("profile_id", group.owner_profile_id)
      .maybeSingle();

    if (promoter) {
      const isActive = promoter.status === "active" || (promoter.status == null && promoter.active === true);

      if (isActive) {
        fallbackPromoter = {
          id: promoter.id,
          code: promoter.code,
          name: promoter.name,
        };
      }
    }
  }

  return {
    id: group.id,
    code: group.invite_code,
    name: group.name,
    ownerProfileId: group.owner_profile_id,
    fallbackPromoter,
  };
}
