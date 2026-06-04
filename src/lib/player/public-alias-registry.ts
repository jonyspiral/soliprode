import { getNormalizedGameNicknameKey } from "@/lib/player/identity";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type ProfileAliasRow = {
  id: string;
  public_alias: string | null;
};

export async function isPublicAliasTaken(alias: string, excludeProfileId?: string | null) {
  const normalizedAlias = getNormalizedGameNicknameKey(alias);

  if (!normalizedAlias) {
    return false;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("profiles").select("id, public_alias").limit(5000);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ProfileAliasRow[]).some((profile) => {
    if (excludeProfileId && profile.id === excludeProfileId) {
      return false;
    }

    return (
      typeof profile.public_alias === "string" &&
      getNormalizedGameNicknameKey(profile.public_alias) === normalizedAlias
    );
  });
}
