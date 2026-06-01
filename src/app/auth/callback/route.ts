import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { ensureBrowserUserRecords } from "@/lib/supabase/browser-bootstrap";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");
  const safeNextPath = nextPath?.startsWith("/") ? nextPath : "/dashboard";
  const redirectUrl = new URL(safeNextPath, requestUrl.origin);
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.redirect(redirectUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=confirm_failed", requestUrl.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=missing_user", requestUrl.origin));
  }

  const bootstrapResult = await ensureBrowserUserRecords(supabase, user);

  if (!bootstrapResult.ok) {
    return NextResponse.redirect(new URL("/login?error=bootstrap_failed", requestUrl.origin));
  }

  return response;
}
