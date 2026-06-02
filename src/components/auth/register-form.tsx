"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, LockIcon, MailIcon, UserIcon } from "@/components/app-icons";
import { mapAuthError } from "@/lib/supabase/auth";
import { ensureBrowserUserRecords } from "@/lib/supabase/browser-bootstrap";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      const promoterCode = String(formData.get("promoter_code") ?? "").trim();

      if (!fullName || !publicAlias || !email || !password) {
        setError("Completá nombre, alias, email y contraseña para continuar.");
        return;
      }

      if (publicAlias.length < 3) {
        setError("El alias público tiene que tener al menos 3 caracteres.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            public_alias: publicAlias,
            whatsapp: whatsapp || null,
            promoter_code: promoterCode || null,
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
          "Tu cuenta ya fue creada. Confirmá tu email y después ingresá con la misma cuenta.",
        );
        router.replace("/login");
        router.refresh();
        return;
      }

      const bootstrapResult = await ensureBrowserUserRecords(supabase, data.user);

      if (!bootstrapResult.ok) {
        setError(bootstrapResult.error);
        return;
      }

      setSuccess("Cuenta creada correctamente. Redirigiendo al panel.");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No pudimos completar el registro en este momento. Intentá de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
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
              className="min-h-12 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
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
              className="min-h-12 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
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
              className="min-h-12 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
              placeholder="+54 9 11..."
            />
          </div>
        </div>

        <div className="relative">
          <label
            htmlFor="email"
            className="absolute -top-2.5 left-3 z-10 bg-[var(--color-bg)] px-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-muted)]"
          >
            Correo electrónico
          </label>
          <div className="flex items-center overflow-hidden rounded-lg border-2 border-[var(--color-line)] bg-white transition focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_8px_rgba(137,208,237,0.3)]">
            <MailIcon className="ml-3 mr-2 h-5 w-5 text-[var(--color-line)]" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="min-h-12 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
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
              className="min-h-12 w-full border-none bg-transparent py-3 pr-4 text-base text-[var(--color-ink)] outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
        <div className="grid gap-2">
          <label
            htmlFor="promoter_code"
            className="font-serif text-lg uppercase tracking-[0.08em] text-[var(--color-primary)]"
          >
            Código de promotor
          </label>
          <input
            id="promoter_code"
            name="promoter_code"
            type="text"
            className="min-h-14 border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-strong)]"
            placeholder="Opcional por ahora"
          />
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Si llegaste por una invitación o promotor, podés dejarlo cargado ahora.
          </p>
        </div>

        <div className="border-[1.5px] border-dashed border-[var(--color-line)] bg-white p-4">
          <p className="font-serif text-2xl uppercase tracking-[0.06em] text-[var(--color-primary)]">
            Grupo y comunidad
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Primero creás tu cuenta. Después elegís dónde competir, con qué oficina jugar y qué
            grupo querés seguir más de cerca.
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
          <input type="checkbox" checked readOnly className="peer h-5 w-5 appearance-none rounded border-2 border-[var(--color-primary)] bg-[var(--color-primary)]" />
          <CheckIcon className="pointer-events-none absolute h-3.5 w-3.5 text-white" />
        </div>
        <span>
          Al crear tu cuenta aceptás recibir información del torneo y completar tu inscripción
          desde el panel.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 py-3 font-serif text-[1.5rem] uppercase tracking-[0.04em] text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
