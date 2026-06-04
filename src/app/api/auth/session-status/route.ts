import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json({
      authenticated: Boolean(user),
    });
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 500 },
    );
  }
}
