"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SurfaceCard } from "@/components/surface-card";
import { PROMOTER_COOKIE_NAME } from "@/lib/auth/promoter-attribution";
import {
  GOOGLE_OAUTH_ERROR_MESSAGE,
  logOAuthDevError,
} from "@/lib/auth/oauth";
import { SOLIPRODE_BRAND_ASSETS } from "@/lib/brand-assets";
import {
  getCanonicalProductionUrl,
  isLegacyProductionHostname,
} from "@/lib/site-url";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type CallbackStatus = "loading" | "error";
type AuthCallbackScreenProps = {
  code: string | null;
  nextPath: string;
  promoterCode: string | null;
};

function withClientTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: number | undefined;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  });
}

function clearPromoterCookie() {
  document.cookie = `${PROMOTER_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function redirectToCanonicalHostIfNeeded() {
  if (typeof window === "undefined" || !isLegacyProductionHostname(window.location.hostname)) {
    return false;
  }

  window.location.replace(getCanonicalProductionUrl(`${window.location.pathname}${window.location.search}`));
  return true;
}

export function AuthCallbackScreen({
  code,
  nextPath,
  promoterCode,
}: AuthCallbackScreenProps) {
  const router = useRouter();
  const startedRef = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>("loading");

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    let cancelled = false;

    async function completeOAuth() {
      if (redirectToCanonicalHostIfNeeded()) {
        return;
      }

      if (!code) {
        setStatus("error");
        window.setTimeout(() => {
          router.replace(`/login?error=oauth_failed&next=${encodeURIComponent(nextPath)}`);
        }, 900);
        return;
      }

      try {
        const supabase = createBrowserSupabaseClient();
        const { error: exchangeError } = await withClientTimeout(
          supabase.auth.exchangeCodeForSession(code),
          8000,
          "oauth_exchange_timeout",
        );

        if (exchangeError) {
          throw new Error(exchangeError.message || "confirm_failed");
        }

        void fetch("/api/auth/finish-signin", {
          body: JSON.stringify({ promoterCode }),
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          method: "POST",
        }).catch((error) => {
          logOAuthDevError("OAuth finish-signin background failed", {
            errorMessage: error instanceof Error ? error.message : String(error),
            nextPath,
          });
        });
        clearPromoterCookie();

        if (!cancelled) {
          // OAuth writes auth cookies in the browser. A hard navigation prevents
          // App Router from rendering the destination with stale pre-auth state.
          window.location.replace(nextPath);
        }
      } catch (error) {
        logOAuthDevError("OAuth callback failed", {
          errorMessage: error instanceof Error ? error.message : String(error),
          nextPath,
        });

        if (!cancelled) {
          setStatus("error");
          window.setTimeout(() => {
            router.replace(`/login?error=oauth_failed&next=${encodeURIComponent(nextPath)}`);
          }, 1200);
        }
      }
    }

    void completeOAuth();

    return () => {
      cancelled = true;
    };
  }, [code, nextPath, promoterCode, router]);

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center py-6">
      <SurfaceCard className="mx-auto w-full max-w-[26rem] p-0">
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <Image
            src={SOLIPRODE_BRAND_ASSETS.primaryLogo}
            alt="SoliProde"
            width={72}
            height={72}
            className="h-[4.5rem] w-[4.5rem]"
            priority
          />

          <div
            className="mt-6 h-12 w-12 animate-spin rounded-full border-4 border-[rgba(0,50,125,0.12)] border-t-[var(--color-primary)]"
            aria-hidden="true"
          />

          <h1 className="mt-6 font-serif text-[2rem] font-bold uppercase leading-none text-[var(--color-primary)]">
            {status === "loading" ? "Ingresando a SoliProde..." : "Volviendo al login"}
          </h1>
          <p className="mt-3 max-w-[20rem] text-sm leading-6 text-[var(--color-muted)]">
            {status === "loading"
              ? "Estamos validando tu cuenta."
              : GOOGLE_OAUTH_ERROR_MESSAGE}
          </p>

          {status === "error" ? (
            <Link
              href={`/login?error=oauth_failed&next=${encodeURIComponent(nextPath)}`}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              Volver al login
            </Link>
          ) : null}
        </div>
      </SurfaceCard>
    </div>
  );
}
