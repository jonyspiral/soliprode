import { redirect } from "next/navigation";

import { CompactFinalTournamentScreen } from "@/components/final/compact-final-tournament-screen";
import { PageStack } from "@/components/placeholder-primitives";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await withSupabaseTimeout(
    supabase.auth.getUser(),
    "Supabase session check timed out",
  );

  if (!user) {
    redirect("/login");
  }

  return (
    <PageStack>
      <CompactFinalTournamentScreen />
    </PageStack>
  );
}
