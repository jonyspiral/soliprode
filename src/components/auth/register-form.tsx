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
import { buildAuthCallbackUrl } from "@/lib/auth/oauth";
import { mapAuthError } from "@/lib/supabase/auth";
import { ensureBrowserUserRecords } from "@/lib/supabase/browser-bootstrap";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type RegisterFormProps = {
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

export function RegisterForm({ promoterCode = null }: RegisterFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const normalizedPromoterCode = useMemo(
    () => normalizePromoterCode(promoterCode),
    [promoterCode],
  );
  const loginHref = appendPromoterQuery("/login", normalizedPromoterCode);

  useEffect(() => {
    persistPromoterCode(normalizedPromoterCode);
  }, [normalizedPromoterCode]);

  async function handleGoogleSignup() {
    setError(null);
    setSuccess(null);
    setGooglePending(true);

    try {
      persistPromoterCode(normalizedPromoterCode);
      const supabase = createBrowserSupabaseClient();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildAuthCallbackUrl("/dashboard"),
        },
      });

      if (oauthError) {
        setError("No pudimos abrir Google ahora. Intentá de nuevo.");
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
      }
    } catch {
      setError("No pudimos abrir Google ahora. Intentá de nuevo.");
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
      const promoterCodeValue = normalizePromoterCode(
        String(formData.get("promoter_code") ?? "").trim(),
      );

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
          emailRedirectTo: buildAuthCallbackUrl("/dashboard"),
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
          mapAuthError(signUpError, "No pudimos crear tu cuenta. Revisá tus datos e intentá de nuevo."),
        );
        return;
      }

      if (!data.user) {
        setError("No pudimos completar el alta. Intentá de nuevo.");
        return;
      }

      if (!data.session) {
        setSuccess(
          "Tu cuenta ya quedó creada. Si Supabase te pide confirmar el correo, hacelo desde el mail y después seguí desde acá.",
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
      setSuccess("Cuenta lista. Entrás a competir.");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No pudimos completar el registro en este momento. Intentá de nuevo.");
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
          Es la forma más rápida de entrar, guardar pronósticos y seguir el ranking.
        </p>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
        <div className="h-px flex-1 bg-[var(--color-line)]" />
        <span>También podés seguir con email</span>
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
              Código de promotor
            </label>
            <input
              id="promoter_code"
              name="promoter_code"
              type="text"
              defaultValue={normalizedPromoterCode ?? ""}
              className="min-h-14 rounded-xl border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-strong)]"
              placeholder="Si venís invitado, dejalo cargado"
            />
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Si llegaste por un promotor o una invitación, ese código queda guardado para tu participación.
            </p>
          </div>

          <div className="rounded-xl border-[1.5px] border-dashed border-[var(--color-line)] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
              Se define después
            </p>
            <p className="mt-2 font-serif text-[1.8rem] uppercase tracking-[0.04em] text-[var(--color-primary)]">
              Grupo y equipo de 11
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Primero entrás al torneo. Después elegís tu grupo, armás tu equipo y salís a pelear el ranking.
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
            Al crear tu cuenta ya podés empezar a cargar pronósticos. El pago entra después, cuando activás tu participación.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-14 w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 font-serif text-[1.35rem] uppercase tracking-[0.04em] text-[#1a1c1c] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta con email"}
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
