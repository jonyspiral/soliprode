import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  PROMOTER_COOKIE_NAME,
  normalizePromoterCode,
} from "@/lib/auth/promoter-attribution";
import {
  AUTH_NEXT_COOKIE_NAME,
  GOOGLE_OAUTH_ERROR_MESSAGE,
  normalizeAuthNextPath,
} from "@/lib/auth/oauth";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

type OAuthCallbackBody = {
  code?: string | null;
  nextPath?: string | null;
  promoterCode?: string | null;
};

function buildSuccessResponse(redirectTo: string) {
  return NextResponse.json({
    ok: true as const,
    redirectTo,
  });
}

function buildErrorResponse(status: number, code: string) {
  return NextResponse.json(
    {
      ok: false,
      code,
      error: GOOGLE_OAUTH_ERROR_MESSAGE,
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as OAuthCallbackBody;
  const code = typeof body.code === "string" ? body.code : null;
  const nextPath = normalizeAuthNextPath(body.nextPath);

  if (!code) {
    return buildErrorResponse(400, "missing_code");
  }

  const promoterCode =
    normalizePromoterCode(body.promoterCode) ??
    normalizePromoterCode(request.cookies.get(PROMOTER_COOKIE_NAME)?.value ?? null);
  const responsePayload = { ok: true as const, redirectTo: nextPath };
  let response = NextResponse.json(responsePayload);

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = buildSuccessResponse(nextPath);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[oauth-callback] exchange failed", exchangeError);
    }
    return buildErrorResponse(401, "confirm_failed");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildErrorResponse(401, "missing_user");
  }

  const bootstrapResult = await ensureRegisteredUserRecords(user, {
    promoterCode,
  });

  if (!bootstrapResult.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[oauth-callback] bootstrap failed", bootstrapResult.error);
    }
    return buildErrorResponse(500, "bootstrap_failed");
  }

  if (request.cookies.get(PROMOTER_COOKIE_NAME)) {
    response.cookies.set(PROMOTER_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
    });
  }

  if (request.cookies.get(AUTH_NEXT_COOKIE_NAME)) {
    response.cookies.set(AUTH_NEXT_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
