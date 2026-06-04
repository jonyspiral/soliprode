"use server";

import { revalidatePath } from "next/cache";
import {
  isValidWhatsapp,
  normalizeGameNickname,
  normalizeWhatsapp,
} from "@/lib/player/identity";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  message: string | null;
  status: "idle" | "error" | "success";
};

export const initialProfileActionState: ProfileActionState = {
  status: "idle",
  message: null,
};

async function requireProfileUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Tu sesión se cerró. Volvé a entrar para editar tu perfil.");
  }

  return { supabase, user };
}

function revalidateProfileSurfaces() {
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath("/teams");
  revalidatePath("/rankings");
}

export async function updateGameProfileAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const { supabase, user } = await requireProfileUser();
    const nickname = normalizeGameNickname(String(formData.get("game_nickname") ?? ""));

    if (nickname.length < 3 || nickname.length > 24) {
      return {
        status: "error",
        message: "Tu nick de juego debe tener entre 3 y 24 caracteres.",
      };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ public_alias: nickname })
      .eq("id", user.id);

    if (error) {
      return {
        status: "error",
        message: "No pudimos guardar tu nick de juego ahora.",
      };
    }

    revalidateProfileSurfaces();

    return {
      status: "success",
      message: "Tu perfil de juego quedó actualizado.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "No pudimos guardar tu perfil de juego ahora.",
    };
  }
}

export async function updateAccountDetailsAction(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const { supabase, user } = await requireProfileUser();
    const whatsapp = normalizeWhatsapp(String(formData.get("whatsapp") ?? ""));

    if (!isValidWhatsapp(whatsapp)) {
      return {
        status: "error",
        message: "El WhatsApp solo puede usar números, espacios, +, paréntesis y guiones.",
      };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ whatsapp })
      .eq("id", user.id);

    if (error) {
      return {
        status: "error",
        message: "No pudimos guardar tus datos de cuenta ahora.",
      };
    }

    revalidateProfileSurfaces();

    return {
      status: "success",
      message: whatsapp
        ? "Tus datos de cuenta quedaron actualizados."
        : "Tu WhatsApp se borró de tus datos de cuenta.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "No pudimos guardar tus datos de cuenta ahora.",
    };
  }
}
