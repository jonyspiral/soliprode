import { NextResponse } from "next/server";
import {
  hasSupabasePublishableKey,
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasSupabaseServiceRoleKey,
} from "@/lib/supabase/config";

export async function GET() {
  const serviceRoleConfigured = hasSupabaseServiceRoleKey();
  const publishableKeyConfigured = hasSupabasePublishableKey();

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabasePublishableKey = getSupabasePublishableKey();

    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabasePublishableKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          reason: response.status === 401 || response.status === 403 ? "invalid_publishable_key" : "upstream_error",
          projectUrl: supabaseUrl,
          publishableKeyConfigured,
          serviceRoleConfigured,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      projectUrl: supabaseUrl,
      publishableKeyConfigured,
      serviceRoleConfigured,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Supabase error";
    const missingEnv =
      message.includes("NEXT_PUBLIC_SUPABASE_URL") || message.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    return NextResponse.json(
      {
        ok: false,
        error: message,
        reason: missingEnv ? "missing_env" : "network_or_supabase_unreachable",
        publishableKeyConfigured,
        serviceRoleConfigured,
      },
      { status: missingEnv ? 500 : 503 },
    );
  }
}
