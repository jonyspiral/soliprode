import {
  buildAvatarCandidateUrls,
  buildGeneratedAvatarDataUrl,
  buildStableAvatarSeed,
  getStoredAvatarChoice,
  getAvatarFallbackVariant,
  getGroupInitials,
  isEmojiAvatarVariant,
  resolveStoredAvatarUrl,
} from "@/lib/avatar/identity";

type GroupIdentityRecord = {
  avatar_seed?: string | null;
  avatar_url?: string | null;
  avatar_variant?: string | null;
  id?: string | null;
  name?: string | null;
};

function trimName(name: string | null | undefined) {
  if (!name || !name.trim()) {
    return "Team";
  }

  return name.trim();
}

export { getGroupInitials };

export function getGroupAvatarModel(group?: GroupIdentityRecord | null) {
  const label = trimName(group?.name);
  const avatarSeed = buildStableAvatarSeed(
    isEmojiAvatarVariant(group?.avatar_variant) ? null : group?.avatar_seed,
    group?.id,
    group?.name,
    label,
  );
  const avatarVariant = getAvatarFallbackVariant("group", avatarSeed, group?.avatar_variant);
  const currentAvatarChoice = getStoredAvatarChoice({
    avatarUrl: group?.avatar_url,
    avatarSeed: group?.avatar_seed,
    avatarVariant: group?.avatar_variant,
  });
  const storedAvatarUrl = resolveStoredAvatarUrl({
    kind: "group",
    avatarUrl: group?.avatar_url,
    label,
    seed: avatarSeed,
    variant: avatarVariant,
  });
  const generatedAvatarUrl = buildGeneratedAvatarDataUrl({
    kind: "group",
      label,
      seed: avatarSeed,
      variant: avatarVariant,
    });
  const selectedAvatarUrl = isEmojiAvatarVariant(group?.avatar_variant)
    ? buildGeneratedAvatarDataUrl({
        kind: "group",
        label,
        seed: group?.avatar_seed ?? avatarSeed,
        variant: "emoji",
      })
    : storedAvatarUrl;
  const imageCandidates = buildAvatarCandidateUrls([selectedAvatarUrl, generatedAvatarUrl]);

  return {
    avatarSeed,
    avatarVariant,
    avatarUrl: imageCandidates[0] ?? null,
    fallbackAvatarUrl: imageCandidates[1] ?? null,
    currentAvatarChoice,
    hasCustomAvatar: currentAvatarChoice !== "auto",
    label,
  };
}

export function getGroupAvatar(group?: GroupIdentityRecord | null) {
  return getGroupAvatarModel(group).avatarUrl;
}
