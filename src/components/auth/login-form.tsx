"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mapAuthError } from "@/lib/supabase/auth";
import { ensureBrowserUserRecords } from "@/lib/supabase/browser-bootstrap";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setPending(true);

    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "").trim();

      if (!email || !password) {
        setError("Completá email y contraseña para continuar.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          mapAuthError(signInError, "No pudimos ingresar con esos datos. Revisalos e intentá de nuevo."),
        );
        return;
      }

      const user = data.user;

      if (!user) {
        setError("Entraste, pero no pudimos recuperar tu cuenta todavía. Intentá de nuevo.");
        return;
      }

      const bootstrapResult = await ensureBrowserUserRecords(supabase, user);

      if (!bootstrapResult.ok) {
        setError(bootstrapResult.error);
        return;
      }

      setSuccess("Sesión iniciada correctamente. Redirigiendo.");
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("No pudimos ingresar en este momento. Intentá de nuevo.");
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
      <input type="hidden" name="next" value={nextPath} />

      <div className="grid gap-2">
        <label
          htmlFor="email"
          className="font-serif text-lg uppercase tracking-[0.08em] text-[var(--color-primary)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="min-h-14 border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-strong)]"
          placeholder="tu@email.com"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="password"
          className="font-serif text-lg uppercase tracking-[0.08em] text-[var(--color-primary)]"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="min-h-14 border-[1.5px] border-[var(--color-line)] bg-white px-4 py-3 text-base text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary-strong)]"
          placeholder="Tu contraseña"
        />
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
        className="inline-flex min-h-14 w-full items-center justify-center border-[1.5px] border-[var(--color-primary)] bg-[var(--color-primary)] px-5 py-3 font-serif text-2xl uppercase tracking-[0.06em] text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-sm text-[var(--color-muted)]">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/register" className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline">
          Creala acá
        </Link>
      </p>
    </form>
  );
}
