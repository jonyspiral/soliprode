import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  PROMOTER_COOKIE_NAME,
  normalizePromoterCode,
} from "@/lib/auth/promoter-attribution";
import {
  AUTH_NEXT_COOKIE_NAME,
  normalizeAuthNextPath,
} from "@/lib/auth/oauth";
import { getCanonicalProductionUrl, isLegacyProductionHostname } from "@/lib/site-url";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

function buildLoginRedirect(request: NextRequest, error: string, nextPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("error", error);
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  if (isLegacyProductionHostname(request.nextUrl.hostname)) {
    return NextResponse.redirect(
      getCanonicalProductionUrl(`${request.nextUrl.pathname}${request.nextUrl.search}`),
      308,
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const nextPath = normalizeAuthNextPath(
    request.nextUrl.searchParams.get("next") ??
      request.cookies.get(AUTH_NEXT_COOKIE_NAME)?.value,
  );
  const promoterCode =
    normalizePromoterCode(request.nextUrl.searchParams.get("p")) ??
    normalizePromoterCode(request.nextUrl.searchParams.get("promoter")) ??
    normalizePromoterCode(request.cookies.get(PROMOTER_COOKIE_NAME)?.value ?? null);

  if (!code) {
    return buildLoginRedirect(request, "missing_code", nextPath);
  }

  let response = NextResponse.redirect(new URL(nextPath, request.url));
  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(new URL(nextPath, request.url));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return buildLoginRedirect(request, "confirm_failed", nextPath);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildLoginRedirect(request, "missing_user", nextPath);
  }

  const bootstrapResult = await ensureRegisteredUserRecords(user, {
    promoterCode,
  });

  if (!bootstrapResult.ok) {
    return buildLoginRedirect(request, "bootstrap_failed", nextPath);
  }

  response.cookies.set(AUTH_NEXT_COOKIE_NAME, "", {
    maxAge: 0,
    path: "/",
  });

  if (request.cookies.get(PROMOTER_COOKIE_NAME)) {
    response.cookies.set(PROMOTER_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}
