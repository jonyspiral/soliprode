"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mapAuthError } from "@/lib/supabase/auth";
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
        setError("No pudimos completar el registro. Intentá de nuevo.");
        return;
      }

      if (!data.session) {
        setSuccess(
          "Tu cuenta fue creada. Antes de continuar necesitás confirmar tu email y después iniciar sesión.",
        );
        router.replace("/login");
        router.refresh();
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
      className="flex flex-col gap-4"
    >
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
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
