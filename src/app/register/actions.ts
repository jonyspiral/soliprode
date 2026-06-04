"use server";
import {
  initialAuthFormState,
  mapAuthError,
  readOptionalString,
  readRequiredString,
  type AuthFormState,
} from "@/lib/supabase/auth";
import {
  GAME_NICKNAME_MAX_LENGTH,
  GAME_NICKNAME_MIN_LENGTH,
  normalizeGameNickname,
} from "@/lib/player/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export { initialAuthFormState };

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    const fullName = readRequiredString(formData, "full_name");
    const publicAlias = normalizeGameNickname(readRequiredString(formData, "public_alias"));
    const whatsapp = readOptionalString(formData, "whatsapp");
    const email = readRequiredString(formData, "email");
    const password = readRequiredString(formData, "password");
    const promoterCode = readOptionalString(formData, "promoter_code");
    const communityName = readOptionalString(formData, "community_name");
    const groupName = readOptionalString(formData, "group_name");

    if (publicAlias.length < GAME_NICKNAME_MIN_LENGTH) {
      return {
        error: `El alias público tiene que tener entre ${GAME_NICKNAME_MIN_LENGTH} y ${GAME_NICKNAME_MAX_LENGTH} caracteres.`,
        success: null,
        redirectTo: null,
      };
    }

    if (publicAlias.length > GAME_NICKNAME_MAX_LENGTH) {
      return {
        error: `El alias público tiene que tener entre ${GAME_NICKNAME_MIN_LENGTH} y ${GAME_NICKNAME_MAX_LENGTH} caracteres.`,
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
