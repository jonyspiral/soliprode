import { NextResponse } from "next/server";
import { createMercadoPagoCheckoutForParticipation } from "@/lib/payments/payment-attempts";
import { hasMercadoPagoAccessToken } from "@/lib/payments/config";
import { SOLIPRODE_RULES_VERSION } from "@/lib/rules";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function buildActivatePassUrl(errorCode?: string) {
  const url = new URL("/activar-pase", "http://soliprode.local");

  if (errorCode) {
    url.searchParams.set("checkout_error", errorCode);
  }

  return `${url.pathname}${url.search}`;
}

function redirectToLocalPath(request: Request, localPath: string, status: 302 | 303 = 303) {
  return NextResponse.redirect(new URL(localPath, request.url), status);
}

export async function POST(request: Request) {
  if (!hasMercadoPagoAccessToken()) {
    return redirectToLocalPath(request, buildActivatePassUrl("mercadopago_not_configured"));
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
    return redirectToLocalPath(request, buildActivatePassUrl("missing_participation"));
  }

  if (!acceptedRules) {
    return redirectToLocalPath(request, buildActivatePassUrl("rules_required"));
  }

  const { error: updateError } = await supabase
    .from("participations")
    .update({
      rules_accepted_at: new Date().toISOString(),
      rules_version: SOLIPRODE_RULES_VERSION,
      is_adult_confirmed: true,
    })
    .eq("id", participationId)
    .eq("profile_id", user.id);

  if (updateError) {
    return redirectToLocalPath(request, buildActivatePassUrl("rules_persist_failed"));
  }

  try {
    const result = await createMercadoPagoCheckoutForParticipation({
      profileId: user.id,
      email: user.email ?? null,
    });

    if (!result.checkoutUrl) {
      return redirectToLocalPath(request, buildActivatePassUrl("checkout_unavailable"));
    }

    return NextResponse.redirect(result.checkoutUrl, 303);
  } catch (error) {
    if (error instanceof Error && error.message === "already_paid") {
      return redirectToLocalPath(request, "/activar-pase", 303);
    }

    if (error instanceof Error && error.message === "missing_participation") {
      return redirectToLocalPath(request, buildActivatePassUrl("missing_participation"));
    }

    return redirectToLocalPath(request, buildActivatePassUrl("checkout_unavailable"));
  }
}
