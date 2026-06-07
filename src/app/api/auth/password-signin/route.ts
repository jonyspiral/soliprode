import { NextResponse } from "next/server";
import { normalizePromoterCode } from "@/lib/auth/promoter-attribution";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function buildRedirectPath(nextPath: string, error?: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("next", nextPath);

  if (error) {
    searchParams.set("error", error);
  }

  return `/login?${searchParams.toString()}`;
}

function resolveSafeNextPath(rawValue: FormDataEntryValue | null) {
  const value = typeof rawValue === "string" ? rawValue.trim() : "";
  return value.startsWith("/") ? value : "/dashboard";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const nextPath = resolveSafeNextPath(formData.get("next"));
  const promoterCode = normalizePromoterCode(String(formData.get("promoter_code") ?? "").trim());

  if (!email || !password) {
    return new NextResponse(null, {
      status: 303,
      headers: {
        Location: buildRedirectPath(nextPath, "missing_credentials"),
      },
    });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return new NextResponse(null, {
        status: 303,
        headers: {
          Location: buildRedirectPath(nextPath, "invalid_credentials"),
        },
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(null, {
        status: 303,
        headers: {
          Location: buildRedirectPath(nextPath, "missing_user"),
        },
      });
    }

    const bootstrapResult = await ensureRegisteredUserRecords(user, {
      promoterCode,
    });

    if (!bootstrapResult.ok) {
      return new NextResponse(null, {
        status: 303,
        headers: {
          Location: buildRedirectPath(nextPath, "bootstrap_failed"),
        },
      });
    }

    return new NextResponse(null, {
      status: 303,
      headers: {
        Location: nextPath,
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 303,
      headers: {
        Location: buildRedirectPath(nextPath, "signin_failed"),
      },
    });
  }
}
