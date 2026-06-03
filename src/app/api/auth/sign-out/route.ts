import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.signOut();
  } catch {
    // Keep logout resilient even if Supabase is temporarily unavailable.
  }

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
      });
    }
  }

  return response;
}
