import type { AuthError } from "@supabase/supabase-js";

export type AuthFormState = {
  error: string | null;
  success: string | null;
  redirectTo: string | null;
};

export const initialAuthFormState: AuthFormState = {
  error: null,
  success: null,
  redirectTo: null,
};

export function readRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`missing:${key}`);
  }

  return value.trim();
}

export function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

export function mapAuthError(error: AuthError | Error | null, fallback: string) {
  if (!error) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "El email o la contraseña no coinciden.";
  }

  if (message.includes("user already registered")) {
    return "Ese email ya tiene una cuenta. Probá iniciar sesión.";
  }

  if (message.includes("password should be at least")) {
    return "La contraseña tiene que tener al menos 6 caracteres.";
  }

  if (message.includes("email not confirmed")) {
    return "Tu cuenta ya existe. Si el acceso por email todavía no abrió, probá con Google o revisá el mail de confirmación.";
  }

  if (message.includes("signup is disabled")) {
    return "El registro está deshabilitado temporalmente.";
  }

  return fallback;
}
