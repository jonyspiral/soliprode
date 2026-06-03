"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleIcon,
  LockIcon,
  MailIcon,
} from "@/components/app-icons";
import {
  PROMOTER_COOKIE_NAME,
  appendPromoterQuery,
  normalizePromoterCode,
} from "@/lib/auth/promoter-attribution";
import {
  buildAuthCallbackUrl,
  hasConfiguredAuthBaseUrl,
} from "@/lib/auth/oauth";
import { mapAuthError } from "@/lib/supabase/auth";
import { ensureBrowserUserRecords } from "@/lib/supabase/browser-bootstrap";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath: string;
  promoterCode?: string | null;
};

function persistPromoterCode(promoterCode: string | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (!promoterCode) {
    document.cookie = `${PROMOTER_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${PROMOTER_COOKIE_NAME}=${encodeURIComponent(promoterCode)}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

export function LoginForm({ nextPath, promoterCode = null }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const normalizedPromoterCode = normalizePromoterCode(promoterCode);
  const registerHref = appendPromoterQuery("/register", normalizedPromoterCode);

  useEffect(() => {
    persistPromoterCode(normalizedPromoterCode);
  }, [normalizedPromoterCode]);

  async function handleGoogleLogin() {
    setError(null);
    setSuccess(null);
    setGooglePending(true);

    try {
      persistPromoterCode(normalizedPromoterCode);
      const redirectTo = buildAuthCallbackUrl(nextPath);
      const hasConfiguredBaseUrl = hasConfiguredAuthBaseUrl();
      const supabase = createBrowserSupabaseClient();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        console.error("Google OAuth start failed", {
          errorMessage: oauthError.message,
          hasConfiguredBaseUrl,
          redirectTo,
        });
        setError("Google no está configurado todavía. Revisá Supabase Provider y URL base.");
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      console.error("Google OAuth start threw before redirect", {
        errorMessage: error instanceof Error ? error.message : String(error),
        hasConfiguredBaseUrl: hasConfiguredAuthBaseUrl(),
        redirectTo:
          typeof window !== "undefined" && window.location.origin
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
            : null,
      });
      setError("Google no está configurado todavía. Revisá Supabase Provider y URL base.");
    } finally {
      setGooglePending(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setPending(true);

    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "").trim();

      if (!email || !password) {
        setError("Completá email y contraseña para seguir jugando.");
        return;
      }

      persistPromoterCode(normalizedPromoterCode);

      const supabase = createBrowserSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          mapAuthError(
            signInError,
            "No pudimos entrar con esos datos. Revisá el email o la contraseña.",
          ),
        );
        return;
      }

      const user = data.user;

      if (!user) {
        setError("Entraste, pero no pudimos recuperar tu cuenta todavía. Probá de nuevo.");
        return;
      }

      const bootstrapResult = await ensureBrowserUserRecords();

      if (!bootstrapResult.ok) {
        setError(bootstrapResult.error);
        return;
      }

      persistPromoterCode(null);
      setSuccess("Listo. Volvés a tu panel.");
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("No pudimos entrar ahora. Probá de nuevo en un rato.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={googlePending}
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg border border-white/40 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleIcon className="h-5 w-5" />
          {googlePending ? "Abriendo Google..." : "Continuar con Google"}
        </button>
        <p className="text-center text-sm text-[var(--color-muted)]">
          Es la jugada más rápida para volver al ranking.
        </p>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        <div className="h-px flex-1 bg-[var(--color-line)]" />
        <span>O entrá con email</span>
        <div className="h-px flex-1 bg-[var(--color-line)]" />
      </div>

      <form
        action={async (formData) => {
          await handleSubmit(formData);
        }}
        className="flex flex-col gap-5"
      >
        <input type="hidden" name="next" value={nextPath} />
        <input type="hidden" name="promoter_code" value={normalizedPromoterCode ?? ""} />

        <div className="relative">
          <label
            htmlFor="email"
            className="absolute -top-2.5 left-3 z-10 bg-[var(--color-bg)] px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)]"
          >
            Email
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border-2 border-[var(--color-line)] bg-white transition focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_8px_rgba(137,208,237,0.3)]">
            <MailIcon className="ml-3 mr-2 h-5 w-5 text-[var(--color-line)]" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="min-h-14 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <div className="relative">
          <label
            htmlFor="password"
            className="absolute -top-2.5 left-3 z-10 bg-[var(--color-bg)] px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)]"
          >
            Contraseña
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border-2 border-[var(--color-line)] bg-white transition focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_8px_rgba(137,208,237,0.3)]">
            <LockIcon className="ml-3 mr-2 h-5 w-5 text-[var(--color-line)]" />
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="min-h-14 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
              placeholder="Tu contraseña"
            />
          </div>
        </div>

        {error ? (
          <p className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 font-serif text-[1.35rem] uppercase tracking-[0.04em] text-[#1a1c1c] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Entrando..." : "Entrá con email"}
        </button>

        <p className="text-center text-sm text-[var(--color-muted)]">
          ¿Todavía no tenés cuenta?{" "}
          <Link href={registerHref} className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline">
            Creala acá
          </Link>
        </p>
      </form>
    </div>
  );
}
