import { NextResponse } from "next/server";
import { normalizePromoterCode } from "@/lib/auth/promoter-attribution";
import { buildEnterHref } from "@/lib/invite-flow";
import { resolveGroupInvite, resolvePromoterInvite } from "@/lib/invite-flow-server";
import { GAME_NICKNAME_MIN_LENGTH } from "@/lib/player/identity";
import { saveUniquePublicAlias } from "@/lib/player/profile-setup";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

function buildEnterErrorHref(params: {
  promoterCode?: string | null;
  groupInviteCode?: string | null;
  error: string;
}) {
  const href = new URL(buildEnterHref(params), "http://soliprode.local");
  href.searchParams.set("setup_error", params.error);
  return `${href.pathname}${href.search}`;
}

function redirectToLocalPath(request: Request, localPath: string, status: 302 | 303 = 303) {
  return NextResponse.redirect(new URL(localPath, request.url), status);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const formData = await request.formData();
  const promoterCode = normalizePromoterCode(String(formData.get("promoter_code") ?? "").trim());
  const manualPromoterCode = normalizePromoterCode(String(formData.get("manual_promoter_code") ?? "").trim());
  const groupInviteCode = String(formData.get("group_invite_code") ?? "").trim();
  const nickname = String(formData.get("game_nickname") ?? "").trim();
  const shouldJoinGroup = String(formData.get("join_group") ?? "") === "1";

  const loginNextPath = buildEnterHref({
    promoterCode,
    groupInviteCode,
  });

  if (!user) {
    return redirectToLocalPath(request, `/login?next=${encodeURIComponent(loginNextPath)}`);
  }

  const bootstrapResult = await ensureRegisteredUserRecords(user);

  if (!bootstrapResult.ok) {
    return redirectToLocalPath(
      request,
      buildEnterErrorHref({
        promoterCode,
        groupInviteCode,
        error: "bootstrap_failed",
      }),
    );
  }

  if (nickname.trim().length < GAME_NICKNAME_MIN_LENGTH) {
    return redirectToLocalPath(
      request,
      buildEnterErrorHref({
        promoterCode,
        groupInviteCode,
        error: "invalid_nickname",
      }),
    );
  }

  try {
    await saveUniquePublicAlias({
      profileId: user.id,
      requestedAlias: nickname,
    });
  } catch (error) {
    const errorCode =
      error instanceof Error && error.message === "nickname_unavailable"
        ? "nickname_unavailable"
        : "invalid_nickname";

    return redirectToLocalPath(
      request,
      buildEnterErrorHref({
        promoterCode,
        groupInviteCode,
        error: errorCode,
      }),
    );
  }

  const [resolvedPromoter, resolvedManualPromoter, resolvedGroupInvite] = await Promise.all([
    resolvePromoterInvite(promoterCode),
    manualPromoterCode ? resolvePromoterInvite(manualPromoterCode) : Promise.resolve(null),
    resolveGroupInvite(groupInviteCode),
  ]);

  if (promoterCode && !resolvedPromoter) {
    return redirectToLocalPath(
      request,
      buildEnterErrorHref({
        promoterCode,
        groupInviteCode,
        error: "invalid_promoter",
      }),
    );
  }

  if (manualPromoterCode && !resolvedManualPromoter) {
    return redirectToLocalPath(
      request,
      buildEnterErrorHref({
        promoterCode,
        groupInviteCode,
        error: "invalid_manual_promoter",
      }),
    );
  }

  if (groupInviteCode && !resolvedGroupInvite) {
    return redirectToLocalPath(
      request,
      buildEnterErrorHref({
        promoterCode,
        groupInviteCode,
        error: "invalid_group",
      }),
    );
  }

  const service = createServiceRoleSupabaseClient();
  const { data: participationRows, error: participationError } = await service
    .from("participations")
    .select("id, promoter_id, group_id, payment_status, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (participationError) {
    return redirectToLocalPath(
      request,
      buildEnterErrorHref({
        promoterCode,
        groupInviteCode,
        error: "participation_missing",
      }),
    );
  }

  const participation = pickPrimaryParticipation(
    (participationRows ?? []) as Array<{
      id: string;
      promoter_id: string | null;
      group_id: string | null;
      payment_status: string;
      created_at: string;
    }>,
  ).participation;

  if (!participation) {
    return redirectToLocalPath(
      request,
      buildEnterErrorHref({
        promoterCode,
        groupInviteCode,
        error: "participation_missing",
      }),
    );
  }

  const fallbackPromoterId = resolvedGroupInvite?.fallbackPromoter?.id ?? null;
  const nextPromoterId =
    participation.promoter_id ??
    resolvedPromoter?.id ??
    resolvedManualPromoter?.id ??
    fallbackPromoterId ??
    null;

  const nextGroupId =
    shouldJoinGroup && resolvedGroupInvite?.id ? resolvedGroupInvite.id : participation.group_id ?? null;

  const updatePayload: Record<string, string | null> = {};

  if (!participation.promoter_id && nextPromoterId) {
    updatePayload.promoter_id = nextPromoterId;
  }

  if (nextGroupId && nextGroupId !== participation.group_id) {
    updatePayload.group_id = nextGroupId;
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await service
      .from("participations")
      .update(updatePayload)
      .eq("id", participation.id);

    if (updateError) {
      return redirectToLocalPath(
        request,
        buildEnterErrorHref({
          promoterCode,
          groupInviteCode,
          error: "setup_persist_failed",
        }),
      );
    }
  }

  if (participation.payment_status === "paid") {
    if (resolvedGroupInvite?.code) {
      return redirectToLocalPath(request, `/groups?code=${encodeURIComponent(resolvedGroupInvite.code)}`);
    }

    return redirectToLocalPath(request, "/dashboard");
  }

  return redirectToLocalPath(request, "/activar-pase");
}

