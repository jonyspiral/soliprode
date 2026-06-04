import { AuthCallbackScreen } from "@/components/auth/auth-callback-screen";
import {
  normalizePromoterCode,
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { normalizeAuthNextPath } from "@/lib/auth/oauth";

type AuthCallbackPageProps = {
  searchParams?: Promise<{
    code?: string;
    next?: string;
    p?: string;
    promoter?: string;
  }>;
};

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const nextPath = normalizeAuthNextPath(params?.next ?? null);
  const promoterCode = params
    ? readPromoterCodeFromSearchParams(new URLSearchParams(params))
    : null;

  return (
    <AuthCallbackScreen
      code={typeof params?.code === "string" ? params.code : null}
      nextPath={nextPath}
      promoterCode={normalizePromoterCode(promoterCode)}
    />
  );
}
