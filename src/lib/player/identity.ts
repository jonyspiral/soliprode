import {
  buildAvatarCandidateUrls,
  buildGeneratedAvatarDataUrl,
  buildStableAvatarSeed,
  getStoredAvatarChoice,
  getAvatarFallbackVariant,
  isEmojiAvatarVariant,
  isGoogleAvatarVariant,
  getPlayerInitials,
  resolveStoredAvatarUrl,
} from "@/lib/avatar/identity";

type PlayerIdentityProfile = {
  id?: string | null;
  avatar_url?: string | null;
  avatar_seed?: string | null;
  avatar_variant?: string | null;
  full_name?: string | null;
  game_nickname?: string | null;
  name?: string | null;
  nickname?: string | null;
  public_alias?: string | null;
  username?: string | null;
};

type PlayerIdentityUser = {
  id?: string | null;
  user_metadata?: {
    avatar_url?: string | null;
    full_name?: string | null;
    name?: string | null;
    picture?: string | null;
    preferred_username?: string | null;
    user_name?: string | null;
  } | null;
};

export { getPlayerInitials };

export const GAME_NICKNAME_MIN_LENGTH = 3;
export const GAME_NICKNAME_MAX_LENGTH = 24;
const PUBLIC_ALIAS_UNIQUE_INDEX = "profiles_public_alias_normalized_unique_idx";

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function getPlayerDisplayName(
  profile?: PlayerIdentityProfile | null,
  user?: PlayerIdentityUser | null,
) {
  const metadata = user?.user_metadata;

  return (
    firstNonEmpty(
      profile?.game_nickname,
      profile?.nickname,
      profile?.username,
      profile?.public_alias,
      metadata?.preferred_username,
      metadata?.user_name,
      profile?.full_name,
      profile?.name,
      metadata?.full_name,
      metadata?.name,
    ) ?? "Jugador"
  );
}

export function getAccountDisplayName(
  profile?: PlayerIdentityProfile | null,
  user?: PlayerIdentityUser | null,
) {
  const metadata = user?.user_metadata;

  return firstNonEmpty(profile?.full_name, profile?.name, metadata?.full_name, metadata?.name);
}

export function getPlayerAvatar(
  profile?: PlayerIdentityProfile | null,
  user?: PlayerIdentityUser | null,
) {
  return getPlayerAvatarModel(profile, user).avatarUrl;
}

export function getPlayerAvatarModel(
  profile?: PlayerIdentityProfile | null,
  user?: PlayerIdentityUser | null,
) {
  const metadata = user?.user_metadata;
  const label = getPlayerDisplayName(profile, user);
  const generatedSeed = buildStableAvatarSeed(
    isEmojiAvatarVariant(profile?.avatar_variant) || isGoogleAvatarVariant(profile?.avatar_variant)
      ? null
      : profile?.avatar_seed,
    user?.id,
    profile?.id,
    profile?.public_alias,
    profile?.full_name,
    metadata?.preferred_username,
    metadata?.full_name,
    label,
  );
  const avatarVariant = getAvatarFallbackVariant("player", generatedSeed, profile?.avatar_variant);
  const currentAvatarChoice = getStoredAvatarChoice({
    avatarUrl: profile?.avatar_url,
    avatarSeed: profile?.avatar_seed,
    avatarVariant: profile?.avatar_variant,
  });
  const storedAvatarUrl = resolveStoredAvatarUrl({
    kind: "player",
    avatarUrl: profile?.avatar_url,
    label,
    seed: generatedSeed,
    variant: avatarVariant,
  });
  const googleAvatarUrl = firstNonEmpty(metadata?.avatar_url, metadata?.picture);
  const generatedAvatarUrl = buildGeneratedAvatarDataUrl({
    kind: "player",
    label,
    seed: generatedSeed,
    variant: avatarVariant,
  });

  const selectedAvatarUrl = isEmojiAvatarVariant(profile?.avatar_variant)
    ? buildGeneratedAvatarDataUrl({
        kind: "player",
        label,
        seed: profile?.avatar_seed ?? generatedSeed,
        variant: "emoji",
      })
    : isGoogleAvatarVariant(profile?.avatar_variant)
      ? googleAvatarUrl
      : storedAvatarUrl;
  const imageCandidates = buildAvatarCandidateUrls(
    isGoogleAvatarVariant(profile?.avatar_variant)
      ? [selectedAvatarUrl, generatedAvatarUrl]
      : [selectedAvatarUrl, googleAvatarUrl, generatedAvatarUrl],
  );

  return {
    avatarSeed: generatedSeed,
    avatarVariant,
    avatarUrl: imageCandidates[0] ?? null,
    fallbackAvatarUrl: imageCandidates[1] ?? null,
    currentAvatarChoice,
    googleAvatarUrl,
    hasCustomAvatar: currentAvatarChoice !== "auto" && currentAvatarChoice !== "google",
  };
}

export function getParticipationStatus(paymentStatus: string | null | undefined) {
  return paymentStatus === "paid" ? "Jugador activo" : "Registrado";
}

export function getPassStatus(paymentStatus: string | null | undefined) {
  return paymentStatus === "paid" ? "Aporte confirmado" : "Pendiente";
}

export function normalizeGameNickname(rawValue: string) {
  return rawValue.trim().replace(/\s+/g, " ").slice(0, GAME_NICKNAME_MAX_LENGTH);
}

export function getNormalizedGameNicknameKey(rawValue: string) {
  return normalizeGameNickname(rawValue).toLowerCase();
}

export function isValidGameNickname(value: string) {
  return value.length >= GAME_NICKNAME_MIN_LENGTH && value.length <= GAME_NICKNAME_MAX_LENGTH;
}

export function buildGameNicknameVariant(baseValue: string, duplicateOffset: number) {
  const normalizedBase = normalizeGameNickname(baseValue) || "Jugador";

  if (duplicateOffset <= 0) {
    return normalizedBase;
  }

  const suffix = `-${duplicateOffset + 1}`;
  const baseLimit = GAME_NICKNAME_MAX_LENGTH - suffix.length;
  const trimmedBase = normalizedBase.slice(0, Math.max(baseLimit, 1)).trim();

  return `${trimmedBase || "J"}${suffix}`;
}

export function isPublicAliasConflictError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "") : "";

  return (
    code === "23505" &&
    (message.includes(PUBLIC_ALIAS_UNIQUE_INDEX) || message.toLowerCase().includes("public_alias"))
  );
}

export function normalizeWhatsapp(rawValue: string) {
  const normalized = rawValue.trim().replace(/\s+/g, " ");
  return normalized || null;
}

export function isValidWhatsapp(value: string | null) {
  if (value === null) {
    return true;
  }

  return /^[0-9+\-() ]+$/.test(value);
}
