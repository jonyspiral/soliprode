import { HomeLanding } from "@/components/home/home-landing";
import { PageStack } from "@/components/placeholder-primitives";
import {
  appendPromoterQuery,
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { buildEnterHref } from "@/lib/invite-flow";
import type { HomeHeroState } from "@/lib/home/player-hero-state";
import { entryConfig } from "@/lib/product/entry-config";
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

  const loginHref = appendPromoterQuery("/login", promoterCode);
  const registerHref = appendPromoterQuery("/register", promoterCode);
  const rulesHref = appendPromoterQuery("/reglamento", promoterCode);
  const heroState: HomeHeroState = {
    kind: "guest",
    primaryAction: { href: registerHref, label: "Entrá al Prode" },
    secondaryAction: { href: loginHref, label: "Ya tengo cuenta" },
  };

  return (
    <PageStack>
      <HomeLanding entryPrice={entryConfig.initialPrice} heroState={heroState} rulesHref={rulesHref} />
    </PageStack>
  );
}
