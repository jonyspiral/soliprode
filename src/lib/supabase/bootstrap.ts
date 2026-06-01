import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SupabaseUserMetadata = {
  full_name?: string | null;
  public_alias?: string | null;
  whatsapp?: string | null;
  promoter_code?: string | null;
  community_name?: string | null;
  group_name?: string | null;
};

function readUserMetadataString(
  metadata: SupabaseUserMetadata | null | undefined,
  key: keyof SupabaseUserMetadata,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function ensureRegisteredUserRecords(user: User) {
  const supabase = await createServerSupabaseClient();
  const metadata = (user.user_metadata ?? {}) as SupabaseUserMetadata;

  const fullName = readUserMetadataString(metadata, "full_name");
  const publicAlias = readUserMetadataString(metadata, "public_alias");
  const whatsapp = readUserMetadataString(metadata, "whatsapp");

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    return {
      ok: false as const,
      error:
        "Pudimos iniciar sesión, pero no verificar tu perfil todavía. Intentá nuevamente en unos minutos.",
    };
  }

  if (!existingProfile) {
    if (!publicAlias) {
      return {
        ok: false as const,
        error:
          "Tu cuenta existe, pero falta completar el alias público inicial. Contactanos para terminar el alta.",
      };
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
      public_alias: publicAlias,
      whatsapp,
      email: user.email ?? null,
      role: "player",
    });

    if (profileError) {
      return {
        ok: false as const,
        error:
          "Pudimos iniciar sesión, pero no completar tu perfil todavía. Intentá nuevamente en unos minutos.",
      };
    }
  }

  const { data: existingParticipation, error: participationReadError } = await supabase
    .from("participations")
    .select("id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  if (participationReadError) {
    return {
      ok: false as const,
      error:
        "Pudimos iniciar sesión, pero no verificar tu inscripción inicial. Intentá nuevamente en unos minutos.",
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
        ok: false as const,
        error:
          "Pudimos iniciar sesión, pero no completar tu inscripción inicial. Intentá nuevamente en unos minutos.",
      };
    }
  }

  return {
    ok: true as const,
  };
}
