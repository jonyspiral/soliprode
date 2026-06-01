"use server";

import { redirect } from "next/navigation";
import {
  initialAuthFormState,
  mapAuthError,
  readOptionalString,
  readRequiredString,
  type AuthFormState,
} from "@/lib/supabase/auth";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
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
      };
    }

    const user = signUpData.user;
    const session = signUpData.session;

    if (!user) {
      return {
        error: "No pudimos completar el registro. Intentá de nuevo.",
      };
    }

    if (!session) {
      return {
        error:
          "Tu cuenta fue creada, pero antes de continuar necesitás confirmar tu email. Después iniciá sesión.",
      };
    }

    const bootstrapResult = await ensureRegisteredUserRecords(user);

    if (!bootstrapResult.ok) {
      return {
        error: bootstrapResult.error,
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("missing:")) {
      return {
        error: "Completá nombre, alias, email y contraseña para continuar.",
      };
    }

    return {
      error: "No pudimos completar el registro en este momento. Intentá de nuevo.",
    };
  }

  redirect("/dashboard");
}
