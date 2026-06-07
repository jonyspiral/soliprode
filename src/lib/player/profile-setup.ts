import {
  buildGameNicknameVariant,
  isPublicAliasConflictError,
  isValidGameNickname,
  normalizeGameNickname,
} from "@/lib/player/identity";
import { isPublicAliasTaken } from "@/lib/player/public-alias-registry";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function saveUniquePublicAlias(params: {
  profileId: string;
  requestedAlias: string;
}) {
  const normalizedAlias = normalizeGameNickname(params.requestedAlias);

  if (!isValidGameNickname(normalizedAlias)) {
    throw new Error("invalid_nickname");
  }

  const service = createServiceRoleSupabaseClient();

  for (let duplicateOffset = 0; duplicateOffset < 20; duplicateOffset += 1) {
    const candidateAlias = buildGameNicknameVariant(normalizedAlias, duplicateOffset);

    if (await isPublicAliasTaken(candidateAlias, params.profileId)) {
      continue;
    }

    const { error } = await service
      .from("profiles")
      .update({
        public_alias: candidateAlias,
      })
      .eq("id", params.profileId);

    if (!error) {
      return candidateAlias;
    }

    if (!isPublicAliasConflictError(error)) {
      throw error;
    }
  }

  throw new Error("nickname_unavailable");
}

