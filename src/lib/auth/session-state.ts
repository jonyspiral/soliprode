import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

export type SessionState =
  | {
      userId: null;
      isAuthenticated: false;
      isPaid: false;
    }
  | {
      userId: string;
      isAuthenticated: true;
      isPaid: boolean;
    };

export async function getServerSessionState(): Promise<SessionState> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

    if (!user) {
      return {
        userId: null,
        isAuthenticated: false,
        isPaid: false,
      };
    }

    const { data: participationRows } = await withSupabaseTimeout(
      Promise.resolve(
        supabase
          .from("participations")
          .select("payment_status, created_at")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(2),
      ),
      "Supabase participation state query timed out",
    );

    return {
      userId: user.id,
      isAuthenticated: true,
      isPaid:
        pickPrimaryParticipation(
          (participationRows ?? []) as Array<{ created_at: string; payment_status: string }>,
        ).participation?.payment_status === "paid",
    };
  } catch {
    return {
      userId: null,
      isAuthenticated: false,
      isPaid: false,
    };
  }
}
