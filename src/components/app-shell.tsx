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
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-primary-strong)] bg-[radial-gradient(circle_at_30%_30%,#8bd4f0,transparent_35%),linear-gradient(135deg,#0c6780_0%,#00327d_100%)] text-xs font-bold text-white shadow-[0_4px_10px_rgba(0,50,125,0.25)]">
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
        <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[color:var(--color-bg)]/92 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
              aria-label="Volver al inicio"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <Link href="/" className="font-serif text-[2.2rem] font-bold leading-none text-[var(--color-primary)]">
              SoliProde
            </Link>
            <div className="w-12" />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[color:var(--color-bg)]/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary)]">
              <SoccerBallIcon className="h-7 w-7" />
            </Link>
            <Link href="/" className="font-serif text-[2.5rem] font-bold leading-none text-[var(--color-primary)]">
              SoliProde
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:hidden">
            <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-primary)]">
              <SoccerBallIcon className="h-7 w-7" />
            </Link>
          </div>

          <div className="sm:hidden">
            <Link href="/" className="font-serif text-[2rem] font-bold leading-none text-[var(--color-primary)]">
              SoliProde
            </Link>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            {primaryNavItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "font-sans text-sm font-semibold uppercase tracking-[0.08em] transition",
                    active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)] hover:text-[var(--color-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {!authReady || !isAuthenticated ? (
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/login"
                  className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]"
                >
                  Ingresar
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[var(--color-gold-soft)] px-4 py-2 font-sans text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] shadow-[0_6px_18px_rgba(233,196,0,0.28)] transition hover:brightness-105"
                >
                  Crear cuenta
                </Link>
              </div>
            ) : (
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/dashboard"
                  className="font-sans text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]"
                >
                  Panel
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="rounded-lg border border-[var(--color-line)] bg-white px-4 py-2 font-sans text-sm font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] transition hover:text-[var(--color-primary)]"
                >
                  Salir
                </button>
              </div>
            )}

            <AvatarChip />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 overflow-x-auto px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] sm:px-6">
          <span className="text-[var(--color-primary)]">Más</span>
          {secondaryNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "text-[var(--color-primary)]" : "hover:text-[var(--color-primary)]"}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-7">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[color:var(--color-surface)]/94 px-3 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          {mobileNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition",
                  active
                    ? "bg-[rgba(154,225,255,0.18)] text-[var(--color-secondary-soft)]"
                    : "text-[var(--color-muted)]",
                ].join(" ")}
              >
                <NavIcon href={item.href} className="mb-1 h-6 w-6" />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
