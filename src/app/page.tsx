import { FinalTournamentScreen } from "@/components/final/final-tournament-screen";
import { PageStack } from "@/components/placeholder-primitives";
import { readPromoterCodeFromSearchParams } from "@/lib/auth/promoter-attribution";
import { buildEnterHref } from "@/lib/invite-flow";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type HomeProps = {
  searchParams?: Promise<{
    p?: string;
    promoter?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : undefined;
  const promoterCode = params ? readPromoterCodeFromSearchParams(new URLSearchParams(params)) : null;

  if (promoterCode) {
    const nextPath = buildEnterHref({ promoterCode });
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(`/?p=${encodeURIComponent(promoterCode)}`)}`);
    }

    redirect(nextPath);
  }

  return (
    <PageStack>
      <FinalTournamentScreen />
    </PageStack>
  );
}
