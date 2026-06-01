"use client";

import { useActionState } from "react";
import { registerAction, initialAuthFormState } from "@/app/register/actions";
import { SubmitButton } from "@/components/auth/submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialAuthFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <label htmlFor="full_name" className="text-sm font-semibold text-[var(--color-ink)]">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] outline-none ring-0 transition focus:border-[var(--color-accent)]"
            placeholder="Nombre y apellido"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="public_alias" className="text-sm font-semibold text-[var(--color-ink)]">
            Alias público
          </label>
          <input
            id="public_alias"
            name="public_alias"
            type="text"
            required
            autoComplete="nickname"
            className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] outline-none ring-0 transition focus:border-[var(--color-accent)]"
            placeholder="Cómo querés aparecer"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="whatsapp" className="text-sm font-semibold text-[var(--color-ink)]">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] outline-none ring-0 transition focus:border-[var(--color-accent)]"
            placeholder="+54 9 11..."
          />
        </div>

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
            minLength={6}
            autoComplete="new-password"
            className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] outline-none ring-0 transition focus:border-[var(--color-accent)]"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-[var(--color-line)] bg-slate-50 p-4">
        <div className="grid gap-2">
          <label htmlFor="promoter_code" className="text-sm font-semibold text-[var(--color-ink)]">
            Código de promotor
          </label>
          <input
            id="promoter_code"
            name="promoter_code"
            type="text"
            className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] outline-none ring-0 transition focus:border-[var(--color-accent)]"
            placeholder="Opcional por ahora"
          />
          <p className="text-xs leading-5 text-[var(--color-muted)]">
            Queda visible en el flujo, pero todavía no se vincula automáticamente al registro.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="community_name" className="text-sm font-semibold text-[var(--color-ink)]">
              Comunidad
            </label>
            <input
              id="community_name"
              name="community_name"
              type="text"
              disabled
              className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white px-4 py-3 text-sm text-slate-400"
              placeholder="Próximamente"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="group_name" className="text-sm font-semibold text-[var(--color-ink)]">
              Grupo
            </label>
            <input
              id="group_name"
              name="group_name"
              type="text"
              disabled
              className="rounded-2xl border border-dashed border-[var(--color-line)] bg-white px-4 py-3 text-sm text-slate-400"
              placeholder="Próximamente"
            />
          </div>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton idleLabel="Crear cuenta" pendingLabel="Creando cuenta..." />
    </form>
  );
}
