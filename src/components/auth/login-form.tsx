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
          mapAuthError(signInError, "No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo."),
        );
        return;
      }

      const user = data.user;

      if (!user) {
        setError("La sesión se abrió, pero no pudimos recuperar tu usuario. Intentá nuevamente.");
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
      setError("No pudimos iniciar sesión en este momento. Intentá de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={async (formData) => {
        await handleSubmit(formData);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="next" value={nextPath} />

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-[var(--color-ink)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] outline-none ring-0 transition focus:border-[var(--color-accent)]"
          placeholder="tu@email.com"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-[var(--color-ink)]">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] outline-none ring-0 transition focus:border-[var(--color-accent)]"
          placeholder="Tu contraseña"
        />
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>

      <p className="text-sm text-[var(--color-muted)]">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/register" className="font-semibold text-[var(--color-accent)]">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
