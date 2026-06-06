"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleIcon,
  LockIcon,
  MailIcon,
} from "@/components/app-icons";
import {
  PROMOTER_COOKIE_NAME,
  normalizePromoterCode,
} from "@/lib/auth/promoter-attribution";
import {
  buildAuthCallbackUrl,
  clearPersistedAuthNextPath,
  hasConfiguredAuthBaseUrl,
  persistAuthNextPath,
} from "@/lib/auth/oauth";
import {
  getCanonicalProductionUrl,
  isLegacyProductionHostname,
  resolvePublicSiteOrigin,
} from "@/lib/site-url";
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

function redirectToCanonicalHostIfNeeded() {
  if (typeof window === "undefined" || !isLegacyProductionHostname(window.location.hostname)) {
    return false;
  }

  window.location.replace(getCanonicalProductionUrl(`${window.location.pathname}${window.location.search}`));
  return true;
}

export function LoginForm({ nextPath, promoterCode = null }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const normalizedPromoterCode = useMemo(() => normalizePromoterCode(promoterCode), [promoterCode]);
  const [manualPromoterCode, setManualPromoterCode] = useState(() => normalizedPromoterCode ?? "");
  const effectivePromoterCode = normalizedPromoterCode ?? normalizePromoterCode(manualPromoterCode);

  useEffect(() => {
    if (redirectToCanonicalHostIfNeeded()) {
      return;
    }

    persistPromoterCode(effectivePromoterCode);
  }, [effectivePromoterCode]);

  async function handleGoogleLogin() {
    setError(null);
    setSuccess(null);
    setGooglePending(true);

    try {
      if (redirectToCanonicalHostIfNeeded()) {
        return;
      }

      persistPromoterCode(effectivePromoterCode);
      persistAuthNextPath(nextPath);
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
        redirectTo: resolvePublicSiteOrigin(
          typeof window !== "undefined" ? window.location.origin : null,
        ),
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

      persistPromoterCode(effectivePromoterCode);

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
      clearPersistedAuthNextPath();
      setSuccess("Listo. Volvés a tu panel.");
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("No pudimos entrar ahora. Probá de nuevo en un rato.");
    } finally {
      setPending(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailExpanded) {
      setError(null);
      setSuccess(null);
      setEmailExpanded(true);
      return;
    }

    await handleSubmit(new FormData(event.currentTarget));
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={googlePending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 text-[0.82rem] font-extrabold uppercase tracking-[0.09em] text-[var(--color-ink)] shadow-[0_8px_18px_rgba(201,169,0,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
            <GoogleIcon className="h-4 w-4" />
          </span>
          {googlePending ? "Abriendo Google..." : "Entrar con Google"}
        </button>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-muted)]">
        <div className="h-px flex-1 bg-[var(--color-line)]" />
        <span>o continuá con email</span>
        <div className="h-px flex-1 bg-[var(--color-line)]" />
      </div>

      <form
        onSubmit={(event) => {
          void handleEmailSubmit(event);
        }}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="next" value={nextPath} />
        <div className="grid gap-2">
          <label
            htmlFor="email"
            className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]"
          >
            Email
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border-[1.5px] border-[var(--color-line)] bg-white transition focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgba(154,225,255,0.22)]">
            <MailIcon className="ml-3 mr-2 h-4 w-4 text-[var(--color-muted)]" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="min-h-12 w-full border-none bg-transparent py-3 pr-4 text-[0.95rem] font-semibold text-[var(--color-ink)] outline-none placeholder:font-normal placeholder:text-[rgba(67,70,83,0.62)]"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        {emailExpanded ? (
          <div className="grid gap-2">
            <label
              htmlFor="password"
              className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--color-primary)]"
            >
              Contraseña
            </label>
            <div className="flex items-center overflow-hidden rounded-lg border-[1.5px] border-[var(--color-line)] bg-white transition focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgba(154,225,255,0.22)]">
              <LockIcon className="ml-3 mr-2 h-4 w-4 text-[var(--color-muted)]" />
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="min-h-12 w-full border-none bg-transparent py-3 pr-4 text-[0.95rem] font-semibold text-[var(--color-ink)] outline-none placeholder:font-normal placeholder:text-[rgba(67,70,83,0.62)]"
                placeholder="Tu contraseña"
              />
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-strong)] px-5 py-3 text-[0.82rem] font-extrabold uppercase tracking-[0.09em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Entrando..." : emailExpanded ? "Entrar con email" : "Continuar"}
        </button>

        <div className="grid gap-2 rounded-xl border border-[rgba(0,50,125,0.12)] bg-[var(--color-surface-muted)] p-3">
          <label
            htmlFor="promoter_code"
            className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--color-muted)]"
          >
            Promotor
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border border-[rgba(195,198,213,0.85)] bg-white transition focus-within:border-[var(--color-primary)]">
            <input
              id="promoter_code"
              name="promoter_code"
              type="text"
              value={normalizedPromoterCode ?? manualPromoterCode}
              onChange={(event) => {
                if (!normalizedPromoterCode) {
                  setManualPromoterCode(event.target.value);
                }
              }}
              readOnly={Boolean(normalizedPromoterCode)}
              className="min-h-10 w-full border-none bg-transparent px-3 py-2 text-[0.9rem] font-semibold text-[var(--color-ink)] outline-none placeholder:font-normal placeholder:text-[rgba(67,70,83,0.56)]"
              placeholder="Código / número"
            />
          </div>
          <p className="text-xs leading-5 text-[var(--color-muted)]">
            {normalizedPromoterCode
              ? "Detectado por link. No hace falta volver a cargarlo."
              : "Opcional si no llegaste por link de promotor."}
          </p>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </p>
        ) : null}

        <div className="grid gap-1 text-center text-[0.76rem] leading-5 text-[var(--color-muted)]">
          <p>El Pase Solidario se activa después del aporte.</p>
          <p>Al entrar aceptás el reglamento y las bases.</p>
        </div>
      </form>
    </div>
  );
}
