type PlayerIdentityProfile = {
  avatar_url?: string | null;
  full_name?: string | null;
  game_nickname?: string | null;
  name?: string | null;
  nickname?: string | null;
  public_alias?: string | null;
  username?: string | null;
};

type PlayerIdentityUser = {
  user_metadata?: {
    avatar_url?: string | null;
    full_name?: string | null;
    name?: string | null;
    picture?: string | null;
    preferred_username?: string | null;
    user_name?: string | null;
  } | null;
};

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
  const metadata = user?.user_metadata;

  return firstNonEmpty(profile?.avatar_url, metadata?.avatar_url, metadata?.picture);
}

export function getPlayerInitials(label: string | null | undefined) {
  if (!label || !label.trim()) {
    return "J";
  }

  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "J";
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
