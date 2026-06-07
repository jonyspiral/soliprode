import { NextResponse } from "next/server";
import { getBankTransferConfig } from "@/lib/payments/bank-transfer";
import { createBankTransferManualReviewForParticipation } from "@/lib/payments/payment-attempts";
import { SOLIPRODE_RULES_VERSION } from "@/lib/rules";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function buildActivatePassUrl(params?: Record<string, string>) {
  const url = new URL("/activar-pase", "http://soliprode.local");

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return `${url.pathname}${url.search}`;
}

function redirectToLocalPath(request: Request, localPath: string, status: 302 | 303 = 303) {
  return NextResponse.redirect(new URL(localPath, request.url), status);
}

export async function POST(request: Request) {
  if (!getBankTransferConfig()) {
    return redirectToLocalPath(
      request,
      buildActivatePassUrl({ transfer_error: "manual_transfer_unavailable" }),
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLocalPath(request, `/login?next=${encodeURIComponent("/activar-pase")}`);
  }

  const formData = await request.formData();
  const participationId = String(formData.get("participation_id") ?? "").trim();
  const acceptedRules = formData.get("accepted_rules");

  if (!participationId) {
    return redirectToLocalPath(
      request,
      buildActivatePassUrl({ transfer_error: "missing_participation" }),
    );
  }

  const { data: participation, error: participationError } = await supabase
    .from("participations")
    .select("id, rules_accepted_at, rules_version, is_adult_confirmed")
    .eq("id", participationId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (participationError || !participation) {
    return redirectToLocalPath(
      request,
      buildActivatePassUrl({ transfer_error: "missing_participation" }),
    );
  }

  const alreadyAcceptedRules = Boolean(
    participation.rules_accepted_at &&
      participation.rules_version === SOLIPRODE_RULES_VERSION &&
      participation.is_adult_confirmed,
  );

  if (!acceptedRules && !alreadyAcceptedRules) {
    return redirectToLocalPath(
      request,
      buildActivatePassUrl({ transfer_error: "rules_required" }),
    );
  }

  if (acceptedRules) {
    const updateResult = await supabase
      .from("participations")
      .update({
        rules_accepted_at: new Date().toISOString(),
        rules_version: SOLIPRODE_RULES_VERSION,
        is_adult_confirmed: true,
      })
      .eq("id", participationId)
      .eq("profile_id", user.id);

    if (updateResult.error) {
      return redirectToLocalPath(
        request,
        buildActivatePassUrl({ transfer_error: "rules_persist_failed" }),
      );
    }
  }

  try {
    await createBankTransferManualReviewForParticipation({
      profileId: user.id,
      source: "activar-pase",
    });

    return redirectToLocalPath(
      request,
      buildActivatePassUrl({ transfer_notice: "submitted" }),
      303,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "already_paid") {
      return redirectToLocalPath(request, "/activar-pase", 303);
    }

    if (error instanceof Error && error.message === "missing_participation") {
      return redirectToLocalPath(
        request,
        buildActivatePassUrl({ transfer_error: "missing_participation" }),
      );
    }

    return redirectToLocalPath(
      request,
      buildActivatePassUrl({ transfer_error: "manual_transfer_unavailable" }),
    );
  }
}
