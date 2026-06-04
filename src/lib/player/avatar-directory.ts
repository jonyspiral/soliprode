import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type AuthAvatarMap = Map<string, string | null>;

function readAvatarFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const avatarUrl =
    "avatar_url" in metadata && typeof metadata.avatar_url === "string"
      ? metadata.avatar_url.trim()
      : "";
  const picture =
    "picture" in metadata && typeof metadata.picture === "string"
      ? metadata.picture.trim()
      : "";

  return avatarUrl || picture || null;
}

export async function getAuthAvatarMap(profileIds: string[]): Promise<AuthAvatarMap> {
  const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))];

  if (uniqueProfileIds.length === 0) {
    return new Map();
  }

  const pendingIds = new Set(uniqueProfileIds);
  const avatarMap: AuthAvatarMap = new Map();
  const supabase = createServiceRoleSupabaseClient();
  let page = 1;

  while (pendingIds.size > 0) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const users = data.users ?? [];

    if (users.length === 0) {
      break;
    }

    for (const user of users) {
      if (!pendingIds.has(user.id)) {
        continue;
      }

      avatarMap.set(user.id, readAvatarFromMetadata(user.user_metadata));
      pendingIds.delete(user.id);
    }

    if (users.length < 200) {
      break;
    }

    page += 1;
  }

  for (const profileId of pendingIds) {
    avatarMap.set(profileId, null);
  }

  return avatarMap;
}
