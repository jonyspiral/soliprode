import type { User } from "@supabase/supabase-js";
import { normalizePromoterCode } from "@/lib/auth/promoter-attribution";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

type SupabaseUserMetadata = {
  full_name?: string | null;
  public_alias?: string | null;
  name?: string | null;
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

function buildFallbackAlias(user: User, metadata: SupabaseUserMetadata) {
  const aliasCandidate =
    readUserMetadataString(metadata, "public_alias") ??
    readUserMetadataString(metadata, "full_name") ??
    readUserMetadataString(metadata, "name") ??
    user.email?.split("@")[0] ??
    `jugador-${user.id.slice(0, 8)}`;

  return aliasCandidate.replace(/\s+/g, " ").trim().slice(0, 40);
}

async function resolvePromoterId(promoterCode: string | null) {
  const normalizedPromoterCode = normalizePromoterCode(promoterCode);

  if (!normalizedPromoterCode) {
    return null;
  }

  try {
    const serviceRoleSupabase = createServiceRoleSupabaseClient();
    const { data } = await serviceRoleSupabase
      .from("promoters")
      .select("id")
      .eq("code", normalizedPromoterCode)
      .eq("active", true)
      .maybeSingle();

    return data?.id ?? null;
  } catch {
    return null;
  }
}

type EnsureRegisteredUserRecordsOptions = {
  promoterCode?: string | null;
};

export async function ensureRegisteredUserRecords(
  user: User,
  options?: EnsureRegisteredUserRecordsOptions,
) {
  const supabase = await createServerSupabaseClient();
  const metadata = (user.user_metadata ?? {}) as SupabaseUserMetadata;

  const fullName =
    readUserMetadataString(metadata, "full_name") ?? readUserMetadataString(metadata, "name");
  const publicAlias = buildFallbackAlias(user, metadata);
  const whatsapp = readUserMetadataString(metadata, "whatsapp");
  const promoterCode =
    normalizePromoterCode(options?.promoterCode) ??
    normalizePromoterCode(readUserMetadataString(metadata, "promoter_code"));
  const promoterId = await resolvePromoterId(promoterCode);

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("id, public_alias")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    return {
      ok: false as const,
      error:
        "Entraste, pero no pudimos verificar tu perfil todavía. Intentá nuevamente en unos minutos.",
    };
  }

  if (!existingProfile) {
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
          "Entraste, pero no pudimos preparar tu perfil todavía. Intentá nuevamente en unos minutos.",
      };
    }
  }

  if (existingProfile && !existingProfile.public_alias) {
    const { error: repairProfileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        public_alias: publicAlias,
        whatsapp,
        email: user.email ?? null,
      })
      .eq("id", user.id);

    if (repairProfileError) {
      return {
        ok: false as const,
        error:
          "Entraste, pero no pudimos completar tu perfil todavía. Intentá nuevamente en unos minutos.",
      };
    }
  }

  const { data: existingParticipation, error: participationReadError } = await supabase
    .from("participations")
    .select("id, promoter_id, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2);

  if (participationReadError) {
    return {
      ok: false as const,
      error:
        "Entraste, pero no pudimos verificar tu inscripción inicial. Intentá nuevamente en unos minutos.",
    };
  }

  const primaryParticipation = pickPrimaryParticipation(
    (existingParticipation ?? []) as Array<{ id: string; promoter_id: string | null; created_at: string }>,
  ).participation;

  if (!primaryParticipation) {
    const { error: participationInsertError } = await supabase.from("participations").insert({
      profile_id: user.id,
      payment_status: "pending",
      promoter_id: promoterId,
      community_id: null,
      group_id: null,
    });

    if (participationInsertError) {
      return {
        ok: false as const,
        error:
          "Entraste, pero no pudimos preparar tu inscripción inicial. Intentá nuevamente en unos minutos.",
      };
    }
  }

  if (primaryParticipation && !primaryParticipation.promoter_id && promoterId) {
    const { error: participationUpdateError } = await supabase
      .from("participations")
      .update({ promoter_id: promoterId })
      .eq("id", primaryParticipation.id);

    if (participationUpdateError) {
      return {
        ok: false as const,
        error:
          "Entraste, pero no pudimos asociar tu invitación todavía. Intentá nuevamente en unos minutos.",
      };
    }
  }

  return {
    ok: true as const,
  };
}
