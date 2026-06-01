"use server";

import { redirect } from "next/navigation";
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

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        public_alias: publicAlias,
        whatsapp,
        email,
        role: "player",
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      return {
        error:
          "La cuenta se creó, pero no pudimos guardar tu perfil. Intentá ingresar nuevamente en unos minutos.",
      };
    }

    const { data: existingParticipation, error: participationReadError } = await supabase
      .from("participations")
      .select("id")
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle();

    if (participationReadError) {
      return {
        error:
          "La cuenta se creó, pero no pudimos verificar tu inscripción inicial. Intentá ingresar nuevamente.",
      };
    }

    if (!existingParticipation) {
      const { error: participationInsertError } = await supabase.from("participations").insert({
        profile_id: user.id,
        payment_status: "pending",
        promoter_id: null,
        community_id: null,
        group_id: null,
      });

      if (participationInsertError) {
        return {
          error:
            "La cuenta se creó, pero no pudimos completar tu inscripción inicial. Intentá ingresar nuevamente.",
        };
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
