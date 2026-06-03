import { HomeLanding } from "@/components/home/home-landing";
import { PageStack } from "@/components/placeholder-primitives";
import {
  appendPromoterQuery,
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { getServerSessionState } from "@/lib/auth/session-state";
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
  const useStandaloneLanding = !sessionState.isPaid;
  const primaryAction = !sessionState.isAuthenticated
    ? { href: registerHref, label: "Entrá al Prode" }
    : useStandaloneLanding
      ? { href: "/dashboard", label: "Entrá al Prode" }
      : sessionState.isPaid
      ? { href: "/matches", label: "Cargá tus pronósticos" }
      : { href: "/dashboard", label: "Entrá al Prode" };
  const secondaryAction = !sessionState.isAuthenticated
    ? { href: loginHref, label: "Ya tengo cuenta" }
    : useStandaloneLanding
      ? { href: "/dashboard", label: "Ya tengo cuenta" }
      : sessionState.isPaid
      ? { href: "/rankings", label: "Ver ranking" }
      : { href: "/matches", label: "Ya tengo cuenta" };

  return (
    <PageStack>
      <HomeLanding
        entryPrice={entryConfig.initialPrice}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </PageStack>
  );
}
