import { NextResponse } from "next/server";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No encontramos tu sesión abierta." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      promoterCode?: string | null;
    };

    const bootstrapResult = await ensureRegisteredUserRecords(user, {
      promoterCode: body.promoterCode ?? null,
    });

    if (!bootstrapResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: bootstrapResult.error,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "No pudimos preparar tu cuenta en este momento.",
      },
      { status: 500 },
    );
  }
}
