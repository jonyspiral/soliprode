"use server";
import {
  initialAuthFormState,
  mapAuthError,
  readOptionalString,
  readRequiredString,
  type AuthFormState,
} from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export { initialAuthFormState };

function normalizeAlias(alias: string) {
  return alias.trim().replace(/\s+/g, " ");
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    const fullName = readRequiredString(formData, "full_name");
    const publicAlias = normalizeAlias(readRequiredString(formData, "public_alias"));
    const whatsapp = readOptionalString(formData, "whatsapp");
    const email = readRequiredString(formData, "email");
    const password = readRequiredString(formData, "password");
    const promoterCode = readOptionalString(formData, "promoter_code");
    const communityName = readOptionalString(formData, "community_name");
    const groupName = readOptionalString(formData, "group_name");

    if (publicAlias.length < 3) {
      return {
        error: "El alias público tiene que tener al menos 3 caracteres.",
        success: null,
        redirectTo: null,
      };
    }

    const supabase = await createServerSupabaseClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          public_alias: publicAlias,
          whatsapp,
          promoter_code: promoterCode,
          community_name: communityName,
          group_name: groupName,
        },
      },
    });

    if (signUpError) {
      return {
        error: mapAuthError(
          signUpError,
          "No pudimos crear tu cuenta. Revisá tus datos e intentá de nuevo.",
        ),
        success: null,
        redirectTo: null,
      };
    }

    const user = signUpData.user;
    const session = signUpData.session;

    if (!user) {
      return {
        error: "No pudimos completar el registro. Intentá de nuevo.",
        success: null,
        redirectTo: null,
      };
    }

    if (!session) {
      return {
        error: null,
        success:
          "Tu cuenta fue creada. Antes de continuar necesitás confirmar tu email y después iniciar sesión.",
        redirectTo: "/login",
      };
    }

    return {
      error: null,
      success: "Cuenta creada correctamente. Redirigiendo al panel.",
      redirectTo: "/dashboard",
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("missing:")) {
      return {
        error: "Completá nombre, alias, email y contraseña para continuar.",
        success: null,
        redirectTo: null,
      };
    }

    return {
      error: "No pudimos completar el registro en este momento. Intentá de nuevo.",
      success: null,
      redirectTo: null,
    };
  }
}
