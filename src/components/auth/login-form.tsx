"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, initialAuthFormState } from "@/app/login/actions";
import { SubmitButton } from "@/components/auth/submit-button";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(loginAction, initialAuthFormState);

  useEffect(() => {
    if (!state.redirectTo) {
      return;
    }

    router.replace(state.redirectTo);
    router.refresh();
  }, [router, state.redirectTo]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <SubmitButton idleLabel="Ingresar" pendingLabel="Ingresando..." />

      <p className="text-sm text-[var(--color-muted)]">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/register" className="font-semibold text-[var(--color-accent)]">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
