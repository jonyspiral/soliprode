import { cookies } from "next/headers";
import { AuthCallbackScreen } from "@/components/auth/auth-callback-screen";
import {
  normalizePromoterCode,
  readPromoterCodeFromSearchParams,
} from "@/lib/auth/promoter-attribution";
import { AUTH_NEXT_COOKIE_NAME, normalizeAuthNextPath } from "@/lib/auth/oauth";

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
  const cookieStore = await cookies();
  const persistedNextPath = cookieStore.get(AUTH_NEXT_COOKIE_NAME)?.value ?? null;
  const nextPath = normalizeAuthNextPath(params?.next ?? persistedNextPath);
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
