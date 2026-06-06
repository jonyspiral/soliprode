import { getPlayerAvatar } from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

export type SessionState =
  | {
      userId: null;
      isAuthenticated: false;
      isPaid: false;
      avatarUrl: null;
      paymentStatus: null;
    }
  | {
      userId: string;
      isAuthenticated: true;
      isPaid: boolean;
      avatarUrl: string | null;
      paymentStatus: string | null;
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
        avatarUrl: null,
        paymentStatus: null,
      };
    }

    let paymentStatus = "pending";

    try {
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
      const primaryParticipation = pickPrimaryParticipation(
        (participationRows ?? []) as Array<{ created_at: string; payment_status: string }>,
      ).participation;
      paymentStatus = primaryParticipation?.payment_status ?? "pending";
    } catch {
      paymentStatus = "pending";
    }

    return {
      userId: user.id,
      isAuthenticated: true,
      isPaid: paymentStatus === "paid",
      avatarUrl: getPlayerAvatar(null, { user_metadata: user.user_metadata }),
      paymentStatus,
    };
  } catch {
    return {
      userId: null,
      isAuthenticated: false,
      isPaid: false,
      avatarUrl: null,
      paymentStatus: null,
    };
  }
}
