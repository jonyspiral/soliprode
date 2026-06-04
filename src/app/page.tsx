import { HomeLanding } from "@/components/home/home-landing";
import { PageStack } from "@/components/placeholder-primitives";
import {
  appendPromoterQuery,
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { getServerSessionState } from "@/lib/auth/session-state";
import { getPlayerHeroState, type HomeHeroState } from "@/lib/home/player-hero-state";
import { entryConfig } from "@/lib/product/entry-config";

type HomeProps = {
  searchParams?: Promise<{
    p?: string;
    promoter?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : undefined;
  const promoterCode = params ? readPromoterCodeFromSearchParams(new URLSearchParams(params)) : null;
  const sessionState = await getServerSessionState();
  const loginHref = appendPromoterQuery("/login", promoterCode);
  const registerHref = appendPromoterQuery("/register", promoterCode);
  const heroState: HomeHeroState = !sessionState.isAuthenticated
    ? {
        kind: "guest",
        primaryAction: { href: registerHref, label: "Entrá al Prode" },
        secondaryAction: { href: loginHref, label: "Ya tengo cuenta" },
      }
    : await getPlayerHeroState({
        userId: sessionState.userId,
        isPaid: sessionState.isPaid,
      });

  return (
    <PageStack>
      <HomeLanding entryPrice={entryConfig.initialPrice} heroState={heroState} />
    </PageStack>
  );
}
