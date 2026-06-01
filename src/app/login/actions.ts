"use server";
import {
  initialAuthFormState,
  mapAuthError,
  readRequiredString,
  type AuthFormState,
} from "@/lib/supabase/auth";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export { initialAuthFormState };

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    const email = readRequiredString(formData, "email");
    const password = readRequiredString(formData, "password");

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        error: mapAuthError(error, "No pudimos iniciar sesión. Revisá tus datos e intentá de nuevo."),
        success: null,
        redirectTo: null,
      };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: "La sesión se abrió, pero no pudimos recuperar tu usuario. Intentá nuevamente.",
        success: null,
        redirectTo: null,
      };
    }

    const bootstrapResult = await ensureRegisteredUserRecords(user);

    if (!bootstrapResult.ok) {
      return {
        error: bootstrapResult.error,
        success: null,
        redirectTo: null,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("missing:")) {
      return {
        error: "Completá email y contraseña para continuar.",
        success: null,
        redirectTo: null,
      };
    }

    return {
      error: "No pudimos iniciar sesión en este momento. Intentá de nuevo.",
      success: null,
      redirectTo: null,
    };
  }

  const nextPath = formData.get("next");
  const safeNextPath =
    typeof nextPath === "string" && nextPath.startsWith("/") ? nextPath : "/dashboard";

  return {
    error: null,
    success: "Sesión iniciada correctamente. Redirigiendo.",
    redirectTo: safeNextPath,
  };
}
