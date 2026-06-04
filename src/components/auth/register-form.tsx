"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
  UserIcon,
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

type RegisterFormProps = {
  promoterCode?: string | null;
  nextPath?: string;
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

export function RegisterForm({ promoterCode = null, nextPath = "/dashboard" }: RegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const normalizedPromoterCode = useMemo(
    () => normalizePromoterCode(promoterCode),
    [promoterCode],
  );
  const [manualPromoterCode, setManualPromoterCode] = useState(() => normalizedPromoterCode ?? "");
  const effectivePromoterCode = normalizedPromoterCode ?? normalizePromoterCode(manualPromoterCode);
  const loginHref = useMemo(() => {
    const basePath = appendPromoterQuery("/login", normalizedPromoterCode);
    const searchParams = new URLSearchParams();

    if (nextPath.startsWith("/")) {
      searchParams.set("next", nextPath);
    }

    return searchParams.size > 0 ? `${basePath}${basePath.includes("?") ? "&" : "?"}${searchParams.toString()}` : basePath;
  }, [nextPath, normalizedPromoterCode]);

  useEffect(() => {
    persistPromoterCode(effectivePromoterCode);
  }, [effectivePromoterCode]);

  async function handleGoogleSignup() {
    setError(null);
    setSuccess(null);
    setGooglePending(true);

    try {
      persistPromoterCode(effectivePromoterCode);
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
        console.error("Google OAuth signup start failed", {
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
      console.error("Google OAuth signup threw before redirect", {
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
      const fullName = String(formData.get("full_name") ?? "").trim();
      const publicAlias = String(formData.get("public_alias") ?? "")
        .trim()
        .replace(/\s+/g, " ");
      const whatsapp = String(formData.get("whatsapp") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "").trim();
      const promoterCodeValue =
        normalizedPromoterCode ??
        normalizePromoterCode(String(formData.get("promoter_code") ?? "").trim());

      if (!fullName || !publicAlias || !email || !password) {
        setError("Completá nombre, alias, email y contraseña para entrar al torneo.");
        return;
      }

      if (publicAlias.length < 3) {
        setError("El alias público tiene que tener al menos 3 caracteres.");
        return;
      }

      persistPromoterCode(promoterCodeValue);

      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(nextPath),
          data: {
            full_name: fullName,
            public_alias: publicAlias,
            whatsapp: whatsapp || null,
            promoter_code: promoterCodeValue || null,
          },
        },
      });

      if (signUpError) {
        setError(
          mapAuthError(
            signUpError,
            "No pudimos crear tu cuenta. Revisá los datos y probá otra vez.",
          ),
        );
        return;
      }

      if (!data.user) {
        setError("No pudimos completar esa cuenta. Probá de nuevo.");
        return;
      }

      if (!data.session) {
        setSuccess(
          "La cuenta quedó creada. Si el email te frena, probá con Google o revisemos la configuración de Supabase para el MVP.",
        );
        router.replace(loginHref);
        router.refresh();
        return;
      }

      const bootstrapResult = await ensureBrowserUserRecords();

      if (!bootstrapResult.ok) {
        setError(bootstrapResult.error);
        return;
      }

      persistPromoterCode(null);
      setSuccess("Cuenta lista. Ya podés entrar a jugar.");
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("No pudimos crear tu cuenta ahora. Probá de nuevo en un rato.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => void handleGoogleSignup()}
          disabled={googlePending}
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg border border-white/40 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleIcon className="h-5 w-5" />
          {googlePending ? "Abriendo Google..." : "Crear cuenta con Google"}
        </button>
        <p className="text-center text-sm text-[var(--color-muted)]">
          Es la jugada más rápida para entrar, cargar pronósticos y pelear el ranking.
        </p>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        <div className="h-px flex-1 bg-[var(--color-line)]" />
        <span>O registrate con email</span>
        <div className="h-px flex-1 bg-[var(--color-line)]" />
      </div>

      <form
        action={async (formData) => {
          await handleSubmit(formData);
        }}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative sm:col-span-2">
            <label
              htmlFor="full_name"
              className="absolute -top-2.5 left-3 z-10 bg-[var(--color-bg)] px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)]"
            >
              Nombre completo
            </label>
            <div className="flex items-center overflow-hidden rounded-lg border-2 border-[var(--color-line)] bg-white transition focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_8px_rgba(137,208,237,0.3)]">
              <UserIcon className="ml-3 mr-2 h-5 w-5 text-[var(--color-line)]" />
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                className="min-h-14 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
                placeholder="Nombre y apellido"
              />
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="public_alias"
              className="absolute -top-2.5 left-3 z-10 bg-[var(--color-bg)] px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)]"
            >
              Alias público
            </label>
            <div className="flex items-center overflow-hidden rounded-lg border-2 border-[var(--color-line)] bg-white transition focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_8px_rgba(137,208,237,0.3)]">
              <UserIcon className="ml-3 mr-2 h-5 w-5 text-[var(--color-line)]" />
              <input
                id="public_alias"
                name="public_alias"
                type="text"
                required
                autoComplete="nickname"
                className="min-h-14 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
                placeholder="Cómo querés aparecer"
              />
            </div>
          </div>

          <div className="relative">
            <label
              htmlFor="whatsapp"
              className="absolute -top-2.5 left-3 z-10 bg-[var(--color-bg)] px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)]"
            >
              WhatsApp
            </label>
            <div className="flex items-center overflow-hidden rounded-lg border-2 border-[var(--color-line)] bg-white transition focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_8px_rgba(137,208,237,0.3)]">
              <UserIcon className="ml-3 mr-2 h-5 w-5 text-[var(--color-line)]" />
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                autoComplete="tel"
                className="min-h-14 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
                placeholder="+54 9 11..."
              />
            </div>
          </div>

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
                minLength={6}
                autoComplete="new-password"
                className="min-h-14 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
          <div className="grid gap-2 rounded-xl border border-[var(--color-line)] bg-white p-4">
            <label
              htmlFor="promoter_code"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]"
            >
              Promotor
            </label>
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
              className="min-h-14 rounded-xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-strong)]"
              placeholder="Código opcional"
            />
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {normalizedPromoterCode
                ? "Llegaste con un Promoter cargado. Ya queda guardado para tu cuenta."
                : "Si no llegaste por link, podés cargar tu Promotor acá como fallback."}
            </p>
          </div>

          <div className="rounded-xl border-[1.5px] border-dashed border-[var(--color-line)] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Se define después
            </p>
            <p className="mt-2 font-serif text-[1.8rem] uppercase tracking-[0.04em] text-[var(--color-primary)]">
              Team y 11 titular
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Primero entrás al Prode. Después armás tu Team, definís tu 11 titular y salís a competir.
            </p>
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

        <label className="flex items-start gap-3 text-sm text-[var(--color-muted)]">
          <div className="relative mt-0.5 flex h-5 w-5 items-center justify-center">
            <input
              type="checkbox"
              checked
              readOnly
              className="peer h-5 w-5 appearance-none rounded border-2 border-[var(--color-primary)] bg-[var(--color-primary)]"
            />
            <CheckIcon className="pointer-events-none absolute h-3.5 w-3.5 text-white" />
          </div>
          <span>
            Creás la cuenta ahora, cargás tus pronósticos y después pagás para competir por premios.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 font-serif text-[1.35rem] uppercase tracking-[0.04em] text-[#1a1c1c] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Creando cuenta..." : "Registrarme con email"}
        </button>

        <p className="text-center text-sm text-[var(--color-muted)]">
          ¿Ya tenés cuenta?{" "}
          <Link href={loginHref} className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline">
            Entrá acá
          </Link>
        </p>
      </form>
    </div>
  );
}
