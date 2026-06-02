"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeftIcon, HomeIcon, MatchIcon, RankingIcon, SoccerBallIcon, UserIcon } from "@/components/app-icons";
import {
  mobileNavItemsAuthenticated,
  mobileNavItemsLoggedOut,
  primaryNavItemsAuthenticated,
  primaryNavItemsLoggedOut,
  secondaryNavItems,
} from "@/lib/navigation";
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
  if (href === "/") {
    return <HomeIcon className={className} />;
  }

  if (href === "/matches") {
    return <MatchIcon className={className} />;
  }

  if (href === "/rankings") {
    return <RankingIcon className={className} />;
  }

  return <UserIcon className={className} />;
}

function AvatarChip() {
  return (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-[var(--color-line)] bg-[linear-gradient(135deg,#9ae1ff_0%,#0047ab_100%)] text-[10px] font-bold text-white shadow-sm">
      SP
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthScreen = pathname === "/login" || pathname === "/register";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let active = true;

    async function syncUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        setIsAuthenticated(Boolean(user));
      } catch {
        if (!active) {
          return;
        }

        setIsAuthenticated(false);
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
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Keep client navigation resilient even if sign out fails remotely.
    }

    setIsAuthenticated(false);
    router.push("/login");
    router.refresh();
  }

  const primaryNavItems =
    authReady && isAuthenticated ? primaryNavItemsAuthenticated : primaryNavItemsLoggedOut;
  const mobileNavItems =
    authReady && isAuthenticated ? mobileNavItemsAuthenticated : mobileNavItemsLoggedOut;

  if (isAuthScreen) {
    return (
      <div className="min-h-screen bg-transparent">
        <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[color:var(--color-bg)]/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between px-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
              aria-label="Volver al inicio"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <Link href="/" className="font-serif text-[1.9rem] font-bold leading-none text-[var(--color-primary)]">
              SoliProde
            </Link>
            <div className="w-10" />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-8 pt-20">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[color:var(--color-bg)]/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between px-4">
          <Link href="/" className="text-[var(--color-primary)] transition hover:opacity-80">
            <SoccerBallIcon className="h-6 w-6" />
          </Link>
          <Link href="/" className="font-serif text-[1.9rem] font-bold leading-none text-[var(--color-primary)]">
            SoliProde
          </Link>
          <div className="flex items-center gap-2">
            {authReady && isAuthenticated ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hidden rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] sm:inline-flex"
              >
                Salir
              </button>
            ) : null}
            <AvatarChip />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-20">
        <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          {primaryNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "shrink-0 rounded-lg border px-3 py-2 transition",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-primary)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface-muted)] hover:text-[var(--color-primary)]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
          {secondaryNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "shrink-0 rounded-lg border px-3 py-2 transition",
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
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[color:var(--color-bg)]/90 px-2 py-3 shadow-[0_-4px_20px_rgba(57,255,20,0.1)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-around gap-2">
          {mobileNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex min-w-[72px] flex-col items-center justify-center rounded-xl px-4 py-1 text-center transition active:scale-90",
                  active
                    ? "bg-[rgba(154,225,255,0.14)] text-[var(--color-secondary)]"
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
