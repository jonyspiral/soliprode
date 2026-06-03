import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Keep logout resilient even if Supabase is temporarily unavailable.
  }

  return NextResponse.json({ ok: true });
}
