"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ArrowLeftIcon, HomeIcon, MatchIcon, RankingIcon, UserIcon } from "@/components/app-icons";
import {
  mobileNavItemsAuthenticated,
  mobileNavItemsLoggedOut,
  secondaryNavItems,
} from "@/lib/navigation";
import { SOLIPRODE_BRAND_ASSETS } from "@/lib/brand-assets";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { resolveParticipationUiState } from "@/lib/participations/status";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AppShellProps = {
  children: ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

function NavIcon({ href, className = "h-5 w-5" }: { href: string; className?: string }) {
  if (href === "/" || href === "/dashboard") {
    return <HomeIcon className={className} />;
  }

  if (href === "/matches") {
    return <MatchIcon className={className} />;
  }

  if (href === "/rankings" || href === "/groups") {
    return <RankingIcon className={className} />;
  }

  return <UserIcon className={className} />;
}

function AvatarChip() {
  return (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[var(--color-line)] bg-[linear-gradient(135deg,#9ae1ff_0%,#0047ab_100%)] text-[10px] font-bold text-white">
      SP
    </div>
  );
}

function BrandLogo() {
  return (
    <span className="inline-flex items-center">
      <Image
        src={SOLIPRODE_BRAND_ASSETS.primaryLogo}
        alt="SoliProde"
        width={160}
        height={44}
        className="h-[32px] w-auto md:h-[40px]"
        priority
      />
    </span>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthScreen = pathname === "/login" || pathname === "/register";
  const isPublicHome = pathname === "/";
  const isSecondaryScreen = secondaryNavItems.some((item) => isActive(pathname, item.href));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const participationUiState = resolveParticipationUiState(participationStatus);
  const showPendingPaymentBanner =
    authReady &&
    isAuthenticated &&
    !participationUiState.isPaid &&
    pathname !== "/matches";

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let active = true;

    async function syncParticipation(userId: string | null) {
      if (!userId) {
        if (active) {
          setParticipationStatus(null);
        }
        return;
      }

      try {
        const { data } = await supabase
          .from("participations")
          .select("payment_status, created_at")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false })
          .limit(2);

        if (!active) {
          return;
        }

        setParticipationStatus(
          pickPrimaryParticipation(
            (data ?? []) as Array<{ created_at: string; payment_status: string }>,
          ).participation?.payment_status ?? null,
        );
      } catch {
        if (active) {
          setParticipationStatus(null);
        }
      }
    }

    async function syncUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        setIsAuthenticated(Boolean(user));
        void syncParticipation(user?.id ?? null);
      } catch {
        if (!active) {
          return;
        }

        setIsAuthenticated(false);
        setParticipationStatus(null);
      } finally {
        if (active) {
          setAuthReady(true);
        }
      }
    }

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      setIsAuthenticated(Boolean(session?.user));
      void syncParticipation(session?.user?.id ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const mobileNavItems =
    authReady && isAuthenticated
      ? mobileNavItemsAuthenticated
      : isPublicHome || isAuthScreen
        ? mobileNavItemsLoggedOut
        : mobileNavItemsAuthenticated;

  if (isAuthScreen) {
    return (
      <div className="min-h-screen bg-transparent">
        <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-line)] bg-[color:var(--color-surface)]/96 backdrop-blur-md">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-6">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
              aria-label="Volver al inicio"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <Link href="/" aria-label="SoliProde" className="inline-flex items-center">
              <BrandLogo />
            </Link>
            <div className="w-10" />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[44rem] flex-1 flex-col px-4 pb-10 pt-[4.5rem] md:px-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-line)] bg-[color:var(--color-surface)]/96 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link
            href={authReady && isAuthenticated ? "/dashboard" : "/"}
            className="inline-flex items-center transition hover:opacity-80"
            aria-label="SoliProde"
          >
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-2">
            {authReady && isAuthenticated ? (
              <>
                <SignOutButton
                  label="Salir"
                  className="inline-flex rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] md:hidden"
                />
                <SignOutButton
                  label="Cerrar sesión"
                  className="hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] md:inline-flex"
                />
              </>
            ) : null}
            <Link href={authReady && isAuthenticated ? "/profile" : "/"} aria-label="Ir a perfil">
              <AvatarChip />
            </Link>
          </div>
        </div>
        {showPendingPaymentBanner ? (
          <div className="border-t border-[var(--color-line)] bg-[rgba(255,225,109,0.14)] px-4 py-2">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 md:px-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]">
                {participationUiState.shellBannerText}
              </p>
              {participationUiState.needsCompletion ? (
                <Link
                  href="/dashboard"
                  className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
                >
                  Completar Pase Solidario
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <main
        className={[
          "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 md:px-6",
          showPendingPaymentBanner ? "pt-[6.75rem]" : "pt-[4.5rem]",
        ].join(" ")}
      >
        {isSecondaryScreen ? (
          <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {secondaryNavItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "shrink-0 rounded-md border px-3 py-2 transition",
                    active
                      ? "border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)]"
                      : "border-[var(--color-line)] bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[color:var(--color-surface)]/96 px-2 py-2 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-around gap-1">
          {mobileNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex min-w-0 flex-1 flex-col items-center justify-center rounded-md px-2 py-1 text-center transition active:scale-90",
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted)]",
                ].join(" ")}
              >
                <NavIcon href={item.href} className="mb-1 h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
