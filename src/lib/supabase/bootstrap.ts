import type { User } from "@supabase/supabase-js";
import { normalizePromoterCode } from "@/lib/auth/promoter-attribution";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import {
  buildGameNicknameVariant,
  isPublicAliasConflictError,
  normalizeGameNickname,
} from "@/lib/player/identity";
import { isPublicAliasTaken } from "@/lib/player/public-alias-registry";
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

  return normalizeGameNickname(aliasCandidate) || `jugador-${user.id.slice(0, 8)}`;
}

async function saveProfileWithUniqueAlias(input: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  profileId: string;
  fullName: string | null;
  publicAlias: string;
  whatsapp: string | null;
  email: string | null;
  isRepair: boolean;
}) {
  for (let duplicateOffset = 0; duplicateOffset < 20; duplicateOffset += 1) {
    const candidateAlias = buildGameNicknameVariant(input.publicAlias, duplicateOffset);

    if (await isPublicAliasTaken(candidateAlias, input.profileId)) {
      continue;
    }

    const basePayload = {
      full_name: input.fullName,
      public_alias: candidateAlias,
      whatsapp: input.whatsapp,
      email: input.email,
    };
    const query = input.isRepair
      ? input.supabase.from("profiles").update(basePayload).eq("id", input.profileId)
      : input.supabase.from("profiles").insert({
          id: input.profileId,
          ...basePayload,
          role: "player",
        });
    const { error } = await query;

    if (!error) {
      return {
        ok: true as const,
        alias: candidateAlias,
      };
    }

    if (!isPublicAliasConflictError(error)) {
      return {
        ok: false as const,
        error,
      };
    }
  }

  return {
    ok: false as const,
    error: new Error("No pudimos asignar un nick de juego disponible."),
  };
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
      .select("id, status, active")
      .eq("code", normalizedPromoterCode)
      .limit(5);

    const activePromoter = (data ?? []).find((row) => {
      const promoter = row as { id: string; status?: string | null; active?: boolean | null };
      return promoter.status === "active" || (promoter.status == null && promoter.active === true);
    });

    return activePromoter?.id ?? null;
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
    const profileInsertResult = await saveProfileWithUniqueAlias({
      supabase,
      profileId: user.id,
      fullName,
      publicAlias,
      whatsapp,
      email: user.email ?? null,
      isRepair: false,
    });

    if (!profileInsertResult.ok) {
      return {
        ok: false as const,
        error:
          "Entraste, pero no pudimos preparar tu perfil todavía. Intentá nuevamente en unos minutos.",
      };
    }
  }

  if (existingProfile && !existingProfile.public_alias) {
    const repairProfileResult = await saveProfileWithUniqueAlias({
      supabase,
      profileId: user.id,
      fullName,
      publicAlias,
      whatsapp,
      email: user.email ?? null,
      isRepair: true,
    });

    if (!repairProfileResult.ok) {
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
