import { NextResponse } from "next/server";
import {
  hasSupabasePublishableKey,
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasSupabaseServiceRoleKey,
} from "@/lib/supabase/config";

function sanitizeProjectUrl(projectUrl: string) {
  try {
    return new URL(projectUrl).origin;
  } catch {
    return "invalid_url";
  }
}

async function readSafeResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json") && !contentType.startsWith("text/")) {
    return null;
  }

  const body = await response.text();
  return body.slice(0, 500);
}

export async function GET() {
  const serviceRoleConfigured = hasSupabaseServiceRoleKey();
  const publishableKeyConfigured = hasSupabasePublishableKey();

  try {
    const supabaseUrl = getSupabaseUrl();
    const supabasePublishableKey = getSupabasePublishableKey();
    const projectUrl = sanitizeProjectUrl(supabaseUrl);

    const response = await fetch(`${supabaseUrl}/rest/v1/teams?select=id&limit=1`, {
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
      },
      cache: "no-store",
    });

    if (response.status !== 200) {
      const responseBody = await readSafeResponseBody(response);

      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          statusText: response.statusText,
          reason: response.status === 401 || response.status === 403 ? "invalid_publishable_key" : "upstream_error",
          projectUrl,
          publishableKeyConfigured,
          serviceRoleConfigured,
          responseBody,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      projectUrl,
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
