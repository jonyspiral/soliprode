"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { HomeIcon, MatchIcon, RankingIcon, TeamIcon, UserIcon } from "@/components/app-icons";
import { StartCheckoutCard } from "@/components/payments/start-checkout-trigger";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { mobileNavItemsAuthenticated, mobileNavItemsLoggedOut, secondaryNavItems } from "@/lib/navigation";
import { SOLIPRODE_BRAND_ASSETS } from "@/lib/brand-assets";
import { getPlayerAvatar, getPlayerDisplayName } from "@/lib/player/identity";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { resolveParticipationUiState } from "@/lib/participations/status";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AppShellProps = { children: ReactNode };
type ServerSessionPayload = {
  authenticated: boolean;
  avatarUrl: string | null;
  isPaid: boolean;
  paymentStatus: string | null;
  userId: string | null;
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavIcon({ href, className = "h-5 w-5" }: { href: string; className?: string }) {
  if (href === "/" || href === "/dashboard") return <HomeIcon className={className} />;
  if (href === "/matches") return <MatchIcon className={className} />;
  if (href === "/rankings") return <RankingIcon className={className} />;
  if (href === "/groups") return <TeamIcon className={className} />;
  return <UserIcon className={className} />;
}

function BrandLogo() {
  return (
    <Image src={SOLIPRODE_BRAND_ASSETS.primaryLogo} alt="SoliProde" width={36} height={36} className="h-8 w-8 md:h-9 md:w-9" priority />
  );
}

function AvatarChip({ avatarUrl, label }: { avatarUrl: string | null; label: string }) {
  return <PlayerAvatar imageUrl={avatarUrl} label={label} size="sm" />;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthScreen = pathname === "/login" || pathname === "/register" || pathname === "/auth/callback";
  const isPublicHome = pathname === "/";
  const isSecondaryScreen = secondaryNavItems.some((item) => isActive(pathname, item.href));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [playerLabel, setPlayerLabel] = useState("Perfil");
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const participationUiState = resolveParticipationUiState(participationStatus);
  const showPendingPaymentBanner = authReady && isAuthenticated && !participationUiState.isPaid;

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let active = true;

    async function syncServerSession() {
      try {
        const response = await fetch("/api/auth/session-status", {
          cache: "no-store",
        });

        if (!active) {
          return null;
        }

        if (!response.ok) {
          const fallbackPayload: ServerSessionPayload = {
            authenticated: false,
            avatarUrl: null,
            isPaid: false,
            paymentStatus: null,
            userId: null,
          };
          return fallbackPayload;
        }

        const payload = (await response.json().catch(() => null)) as ServerSessionPayload | null;
        const normalizedPayload: ServerSessionPayload = payload ?? {
          authenticated: false,
          avatarUrl: null,
          isPaid: false,
          paymentStatus: null,
          userId: null,
        };
        return normalizedPayload;
      } catch {
        if (!active) {
          return null;
        }

        const fallbackPayload: ServerSessionPayload = {
          authenticated: false,
          avatarUrl: null,
          isPaid: false,
          paymentStatus: null,
          userId: null,
        };
        return fallbackPayload;
      }
    }

    async function syncParticipation(userId: string | null, fallbackPaymentStatus: string | null) {
      if (!userId) {
        if (active) setParticipationStatus(fallbackPaymentStatus);
        return;
      }
      try {
        const { data } = await supabase
          .from("participations")
          .select("payment_status, created_at")
          .eq("profile_id", userId)
          .order("created_at", { ascending: false })
          .limit(2);
        if (!active) return;
        setParticipationStatus(
          pickPrimaryParticipation((data ?? []) as Array<{ created_at: string; payment_status: string }>).participation?.payment_status ?? fallbackPaymentStatus,
        );
      } catch {
        if (active) setParticipationStatus(fallbackPaymentStatus);
      }
    }

    async function syncProfileIdentity(
      user: { id: string; user_metadata?: Record<string, unknown> } | null,
      fallbackAvatarUrl: string | null,
    ) {
      if (!user) {
        if (active) {
          setAvatarUrl(fallbackAvatarUrl);
          setPlayerLabel("Perfil");
        }
        return;
      }
      try {
        const { data: profile } = await supabase.from("profiles").select("full_name, public_alias").eq("id", user.id).maybeSingle();
        if (!active) return;
        setPlayerLabel(getPlayerDisplayName(profile ?? null, { user_metadata: user.user_metadata ?? null }));
        setAvatarUrl(getPlayerAvatar(profile ?? null, { user_metadata: user.user_metadata ?? null }));
      } catch {
        if (active) {
          setPlayerLabel(getPlayerDisplayName(null, { user_metadata: user.user_metadata ?? null }));
          setAvatarUrl(getPlayerAvatar(null, { user_metadata: user.user_metadata ?? null }));
        }
      }
    }

    async function syncUser() {
      try {
        const serverState = await syncServerSession();
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        const hasServerSession = Boolean(serverState?.authenticated);
        const effectiveUserId = user?.id ?? serverState?.userId ?? null;
        const nextIsAuthenticated = Boolean(user) || hasServerSession;
        setIsAuthenticated(nextIsAuthenticated);
        if (hasServerSession && serverState?.avatarUrl) {
          setAvatarUrl(serverState.avatarUrl);
        }
        void syncProfileIdentity(
          user ? { id: user.id, user_metadata: user.user_metadata ?? null } : null,
          serverState?.avatarUrl ?? null,
        );
        void syncParticipation(effectiveUserId, serverState?.paymentStatus ?? null);
      } catch {
        if (!active) return;
        setIsAuthenticated(false);
        setAvatarUrl(null);
        setPlayerLabel("Perfil");
        setParticipationStatus(null);
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void syncUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      void (async () => {
        const serverState = await syncServerSession();
        if (!active) return;
        const nextIsAuthenticated = Boolean(session?.user) || Boolean(serverState?.authenticated);
        setIsAuthenticated(nextIsAuthenticated);
        if (serverState?.avatarUrl && !session?.user) {
          setAvatarUrl(serverState.avatarUrl);
        }
        void syncProfileIdentity(
          session?.user ? { id: session.user.id, user_metadata: session.user.user_metadata ?? null } : null,
          serverState?.avatarUrl ?? null,
        );
        void syncParticipation(
          session?.user?.id ?? serverState?.userId ?? null,
          serverState?.paymentStatus ?? null,
        );
        setAuthReady(true);
      })();
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const mobileNavItems = authReady && isAuthenticated ? mobileNavItemsAuthenticated : isPublicHome || isAuthScreen ? mobileNavItemsLoggedOut : mobileNavItemsAuthenticated;
  const profileHref =
    !authReady
      ? pathname
      : isAuthenticated
        ? "/profile"
        : "/login?next=/profile&error=session_required";

  if (isAuthScreen) {
    return (
      <div className="min-h-screen bg-transparent">
        <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-line)] bg-[color:var(--color-surface)]/96 backdrop-blur-md">
          <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center px-4 md:px-6">
            <Link href="/" aria-label="SoliProde" className="inline-flex items-center justify-center"><BrandLogo /></Link>
            <Link href="/" aria-label="SoliProde" className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center">
              <span className="font-serif text-[1.45rem] font-bold leading-none tracking-[-0.01em] text-[var(--color-primary)] md:text-[1.65rem]">SoliProde</span>
            </Link>
            <div className="ml-auto h-8 w-8" aria-hidden="true" />
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-[44rem] flex-1 flex-col px-4 pb-10 pt-[4.5rem] md:px-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-line)] bg-[color:var(--color-surface)]/96 backdrop-blur-md">
        <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center px-4 md:px-6">
          <Link href={authReady && isAuthenticated ? "/dashboard" : "/"} className="inline-flex items-center justify-center transition hover:opacity-80" aria-label="SoliProde"><BrandLogo /></Link>
          <Link href={authReady && isAuthenticated ? "/dashboard" : "/"} className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center transition hover:opacity-80" aria-label="SoliProde">
            <span className="font-serif text-[1.45rem] font-bold leading-none tracking-[-0.01em] text-[var(--color-primary)] md:text-[1.65rem]">SoliProde</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={profileHref}
              aria-label={authReady ? "Ir a perfil" : "Confirmando sesión"}
              aria-disabled={!authReady}
              onClick={(event) => {
                if (!authReady) {
                  event.preventDefault();
                }
              }}
              className={!authReady ? "pointer-events-none opacity-80" : undefined}
            >
              <AvatarChip avatarUrl={avatarUrl} label={playerLabel} />
            </Link>
          </div>
        </div>
        {showPendingPaymentBanner ? (
          <div className="shell-status-banner px-4">
            <div className="mx-auto w-full max-w-6xl md:px-2">
              <StartCheckoutCard className="block w-full text-left">
                <div className="shell-status-banner-inner">
                  <div className="shell-status-banner-track"><div className="shell-status-banner-marquee"><span className="shell-status-banner-kicker">No activo</span><span className="shell-status-banner-copy">No tenés Pase Solidario. Completá tu inscripción para competir.</span></div></div>
                  <span className="shell-status-banner-cta">Completar</span>
                </div>
              </StartCheckoutCard>
            </div>
          </div>
        ) : null}
      </header>
      <main className={["mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-24 md:px-6", showPendingPaymentBanner ? "pt-[6.55rem] md:pt-[6.25rem]" : "pt-[4.5rem]"].join(" ")}> 
        {isSecondaryScreen ? (
          <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {secondaryNavItems.map((item) => {
              const active = isActive(pathname, item.href);
              return <Link key={item.href} href={item.href} className={["shrink-0 rounded-md border px-3 py-2 transition", active ? "border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)]" : "border-[var(--color-line)] bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]"].join(" ")}>{item.label}</Link>;
            })}
          </div>
        ) : null}
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[color:var(--color-surface)]/96 px-2 py-2 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-around gap-1">
          {mobileNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            return <Link key={item.href} href={item.href} className={["flex min-w-0 flex-1 flex-col items-center justify-center rounded-md px-2 py-1 text-center transition active:scale-90", active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"].join(" ")}><NavIcon href={item.href} className="mb-1 h-5 w-5" /><span className="text-[10px] font-semibold">{item.label}</span></Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
