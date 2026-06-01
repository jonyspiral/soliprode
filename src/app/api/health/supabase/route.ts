import { NextResponse } from "next/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  hasSupabaseServiceRoleKey,
} from "@/lib/supabase/config";

export async function GET() {
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          projectUrl: supabaseUrl,
          serviceRoleConfigured: hasSupabaseServiceRoleKey(),
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: response.status,
      projectUrl: supabaseUrl,
      serviceRoleConfigured: hasSupabaseServiceRoleKey(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown Supabase error",
      },
      { status: 500 },
    );
  }
}
