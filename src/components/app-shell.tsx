"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { mobileNavItems, navItems } from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,#f5f7ff,transparent_32%),linear-gradient(180deg,#fcfdff_0%,#f3f7fb_100%)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)]/70 bg-[color:var(--color-surface)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
              SoliProde
            </Link>
            <p className="text-sm text-[var(--color-muted)]">
              Prode Mundial Solidario 2026
            </p>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
          >
            Ingresar
          </Link>
        </div>
        <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-white text-[var(--color-muted)] ring-1 ring-[var(--color-line)] hover:text-[var(--color-ink)]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-line)] bg-[color:var(--color-surface)]/95 px-2 py-2 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1">
          {mobileNavItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex min-w-0 flex-1 justify-center rounded-2xl px-2 py-3 text-center text-xs font-semibold transition",
                  active
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-muted)] hover:bg-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
