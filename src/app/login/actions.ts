"use server";

import { redirect } from "next/navigation";
import {
  initialAuthFormState,
  mapAuthError,
  readRequiredString,
  type AuthFormState,
} from "@/lib/supabase/auth";
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
      };
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("missing:")) {
      return {
        error: "Completá email y contraseña para continuar.",
      };
    }

    return {
      error: "No pudimos iniciar sesión en este momento. Intentá de nuevo.",
    };
  }

  const nextPath = formData.get("next");
  const safeNextPath =
    typeof nextPath === "string" && nextPath.startsWith("/") ? nextPath : "/dashboard";
  redirect(safeNextPath);
}
