export type AvatarKind = "player" | "group";
export type AvatarSelectionMode = "auto" | "google" | "emoji" | "soliprode" | "custom";
export type AvatarEmojiCategory = "Caras" | "Animales" | "Deporte" | "Simbolos" | "Banderas";

type AvatarPalette = {
  background: string;
  accent: string;
  detail: string;
  text: string;
};

type ParsedPresetAvatarReference = {
  kind: AvatarKind;
  seed: string;
  variant: string;
};

export type AvatarEmojiOption = {
  category: AvatarEmojiCategory;
  emoji: string;
  key: string;
  label: string;
  recommended: boolean;
};

const PLAYER_VARIANTS = [
  "stadium",
  "captain",
  "wing",
  "goal",
  "tribune",
  "prode",
] as const;

const GROUP_VARIANTS = [
  "shield",
  "crest",
  "banner",
  "rivals",
  "cup",
  "club",
] as const;

const PLAYER_PALETTES: AvatarPalette[] = [
  { background: "#00327d", accent: "#0047ab", detail: "#ffe16d", text: "#ffffff" },
  { background: "#0c6780", accent: "#00327d", detail: "#ffe16d", text: "#ffffff" },
  { background: "#1f6ed4", accent: "#00327d", detail: "#e9c400", text: "#ffffff" },
  { background: "#001a5c", accent: "#0047ab", detail: "#ffe16d", text: "#ffffff" },
  { background: "#2559bd", accent: "#0c6780", detail: "#ffe16d", text: "#ffffff" },
  { background: "#00327d", accent: "#0f819c", detail: "#ffe16d", text: "#ffffff" },
] as const;

const GROUP_PALETTES: AvatarPalette[] = [
  { background: "#00327d", accent: "#001a5c", detail: "#ffe16d", text: "#ffffff" },
  { background: "#0047ab", accent: "#00327d", detail: "#ffe16d", text: "#ffffff" },
  { background: "#0c6780", accent: "#00327d", detail: "#ffe16d", text: "#ffffff" },
  { background: "#2559bd", accent: "#001a5c", detail: "#e9c400", text: "#ffffff" },
  { background: "#001a5c", accent: "#0c6780", detail: "#ffe16d", text: "#ffffff" },
  { background: "#00327d", accent: "#1f6ed4", detail: "#ffe16d", text: "#ffffff" },
] as const;

const PRESET_PREFIX = "preset";
const EMOJI_PREFIX = "emoji";
const GOOGLE_SELECTION = "google";
const AUTO_SELECTION = "auto";
const EMOJI_VARIANT = "emoji";
const GOOGLE_VARIANT = "google";
const EMOJI_REGEX = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u200d]/u;

const PLAYER_EMOJIS: AvatarEmojiOption[] = [
  { category: "Deporte", emoji: "⚽", key: "ball", label: "Futbol", recommended: true },
  { category: "Deporte", emoji: "🏆", key: "cup", label: "Copa", recommended: true },
  { category: "Simbolos", emoji: "🔥", key: "fire", label: "Fuego", recommended: true },
  { category: "Caras", emoji: "😎", key: "cool", label: "Facha", recommended: true },
  { category: "Deporte", emoji: "🎯", key: "target", label: "Punteria", recommended: true },
  { category: "Simbolos", emoji: "🚀", key: "rocket", label: "Cohete", recommended: true },
  { category: "Animales", emoji: "🐐", key: "goat", label: "GOAT", recommended: true },
  { category: "Simbolos", emoji: "⭐", key: "star", label: "Estrella", recommended: true },
  { category: "Simbolos", emoji: "💪", key: "power", label: "Potencia", recommended: true },
  { category: "Caras", emoji: "🧠", key: "brain", label: "Cabeza", recommended: true },
  { category: "Deporte", emoji: "🧤", key: "glove", label: "Arquero", recommended: true },
  { category: "Deporte", emoji: "🥇", key: "gold", label: "Primero", recommended: true },
  { category: "Simbolos", emoji: "🎉", key: "party", label: "Fiesta", recommended: true },
  { category: "Simbolos", emoji: "⚡", key: "thunder", label: "Rayo", recommended: true },
  { category: "Simbolos", emoji: "👑", key: "crown", label: "Rey", recommended: true },
  { category: "Simbolos", emoji: "🌟", key: "shine", label: "Brillo", recommended: true },
  { category: "Caras", emoji: "🤖", key: "robot", label: "Robot", recommended: false },
  { category: "Caras", emoji: "🥶", key: "cold", label: "Frio", recommended: false },
  { category: "Caras", emoji: "😤", key: "rage", label: "Actitud", recommended: false },
  { category: "Caras", emoji: "🥳", key: "party-face", label: "Festejo", recommended: false },
  { category: "Animales", emoji: "🦊", key: "fox", label: "Zorro", recommended: false },
  { category: "Animales", emoji: "🦈", key: "shark", label: "Tiburon", recommended: false },
  { category: "Animales", emoji: "🦁", key: "lion", label: "Leon", recommended: false },
  { category: "Deporte", emoji: "🥅", key: "goal-net", label: "Red", recommended: false },
  { category: "Deporte", emoji: "📣", key: "megaphone", label: "Aliento", recommended: false },
  { category: "Simbolos", emoji: "🛡️", key: "shield", label: "Escudo", recommended: false },
  { category: "Simbolos", emoji: "🎺", key: "trumpet", label: "Tribuna", recommended: false },
  { category: "Banderas", emoji: "🇦🇷", key: "ar", label: "Argentina", recommended: false },
  { category: "Banderas", emoji: "🇧🇷", key: "br", label: "Brasil", recommended: false },
  { category: "Banderas", emoji: "🇺🇾", key: "uy", label: "Uruguay", recommended: false },
] as const;

const GROUP_EMOJIS: AvatarEmojiOption[] = [
  { category: "Animales", emoji: "🦁", key: "lion", label: "Leones", recommended: true },
  { category: "Animales", emoji: "🐺", key: "wolf", label: "Lobos", recommended: true },
  { category: "Animales", emoji: "🦅", key: "eagle", label: "Aguilas", recommended: true },
  { category: "Animales", emoji: "🐯", key: "tiger", label: "Tigres", recommended: true },
  { category: "Animales", emoji: "🐉", key: "dragon", label: "Dragones", recommended: true },
  { category: "Animales", emoji: "🐍", key: "snake", label: "Serpientes", recommended: true },
  { category: "Simbolos", emoji: "⚡", key: "lightning", label: "Relampago", recommended: true },
  { category: "Simbolos", emoji: "🔥", key: "fire", label: "Fuego", recommended: true },
  { category: "Simbolos", emoji: "🛡️", key: "badge", label: "Escudo", recommended: true },
  { category: "Simbolos", emoji: "👑", key: "royal", label: "Corona", recommended: true },
  { category: "Deporte", emoji: "🏆", key: "team-cup", label: "Copa", recommended: true },
  { category: "Deporte", emoji: "⚽", key: "team-ball", label: "Pelota", recommended: true },
  { category: "Simbolos", emoji: "🚀", key: "team-rocket", label: "Cohete", recommended: true },
  { category: "Simbolos", emoji: "⭐", key: "team-star", label: "Estrella", recommended: true },
  { category: "Simbolos", emoji: "💪", key: "team-power", label: "Fuerza", recommended: true },
  { category: "Deporte", emoji: "🎯", key: "team-target", label: "Punteria", recommended: true },
  { category: "Animales", emoji: "🦈", key: "team-shark", label: "Tiburones", recommended: false },
  { category: "Animales", emoji: "🦊", key: "team-fox", label: "Zorros", recommended: false },
  { category: "Animales", emoji: "🐻", key: "team-bear", label: "Osos", recommended: false },
  { category: "Banderas", emoji: "🇦🇷", key: "team-ar", label: "Argentina", recommended: false },
] as const;

function trimValue(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function encodeSvg(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function uniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.map(trimValue).filter((value): value is string => Boolean(value)))];
}

function getVariantOptions(kind: AvatarKind) {
  return kind === "player" ? PLAYER_VARIANTS : GROUP_VARIANTS;
}

function getPalette(kind: AvatarKind, variant: string, seed: string) {
  const palettes = kind === "player" ? PLAYER_PALETTES : GROUP_PALETTES;
  const hash = hashString(`${kind}:${variant}:${seed}`);
  return palettes[hash % palettes.length];
}

function buildPlayerSvg(label: string, seed: string, variant: string) {
  const palette = getPalette("player", variant, seed);
  const initials = escapeXml(getPlayerInitials(label));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.accent}" />
          <stop offset="100%" stop-color="${palette.background}" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="64" fill="url(#bg)" />
      <circle cx="64" cy="39" r="22" fill="${palette.detail}" opacity="0.22" />
      <path d="M25 104c8-22 24-33 39-33s31 11 39 33" fill="${palette.detail}" opacity="0.18" />
      <path d="M20 92h88" stroke="${palette.detail}" stroke-width="8" stroke-linecap="round" opacity="0.92" />
      <path d="M32 26c12 5 22 8 32 8s20-3 32-8" stroke="${palette.detail}" stroke-width="8" stroke-linecap="round" opacity="0.88" />
      <text x="64" y="76" text-anchor="middle" fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" letter-spacing="1">${initials}</text>
    </svg>
  `;
}

function buildGroupSvg(label: string, seed: string, variant: string) {
  const palette = getPalette("group", variant, seed);
  const initials = escapeXml(getGroupInitials(label));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 144" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.accent}" />
          <stop offset="100%" stop-color="${palette.background}" />
        </linearGradient>
      </defs>
      <path d="M64 8 114 26v38c0 38-24 58-50 72C38 122 14 102 14 64V26L64 8Z" fill="url(#bg)" />
      <path d="M31 46h66" stroke="${palette.detail}" stroke-width="10" stroke-linecap="round" opacity="0.92" />
      <path d="M42 90h44" stroke="${palette.detail}" stroke-width="8" stroke-linecap="round" opacity="0.9" />
      <circle cx="64" cy="105" r="7" fill="${palette.detail}" opacity="0.95" />
      <text x="64" y="80" text-anchor="middle" fill="${palette.text}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" letter-spacing="1">${initials}</text>
    </svg>
  `;
}

function buildEmojiSvg(input: {
  kind: AvatarKind;
  emoji: string;
  seed: string;
}) {
  const palette = getPalette(input.kind, "emoji", input.seed);
  const safeEmoji = escapeXml(input.emoji);

  if (input.kind === "player") {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${safeEmoji}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${palette.accent}" />
            <stop offset="100%" stop-color="${palette.background}" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="64" fill="url(#bg)" />
        <circle cx="64" cy="64" r="50" fill="rgba(255,255,255,0.08)" />
        <circle cx="64" cy="64" r="45" fill="none" stroke="${palette.detail}" stroke-width="6" opacity="0.92" />
        <path d="M24 42c14-12 36-18 56-18s24 2 24 2" stroke="rgba(255,255,255,0.14)" stroke-width="8" stroke-linecap="round" />
        <text x="64" y="82" text-anchor="middle" font-size="52">${safeEmoji}</text>
      </svg>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 144" role="img" aria-label="${safeEmoji}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.accent}" />
          <stop offset="100%" stop-color="${palette.background}" />
        </linearGradient>
      </defs>
      <path d="M64 8 114 26v38c0 38-24 58-50 72C38 122 14 102 14 64V26L64 8Z" fill="url(#bg)" />
      <path d="M30 34h68" stroke="${palette.detail}" stroke-width="8" stroke-linecap="round" opacity="0.88" />
      <path d="M38 102h52" stroke="rgba(255,255,255,0.16)" stroke-width="6" stroke-linecap="round" />
      <circle cx="64" cy="71" r="38" fill="rgba(255,255,255,0.08)" />
      <text x="64" y="88" text-anchor="middle" font-size="48">${safeEmoji}</text>
    </svg>
  `;
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

export function getGroupInitials(label: string | null | undefined) {
  if (!label || !label.trim()) {
    return "TM";
  }

  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "TM";
}

export function isEmojiAvatarVariant(value: string | null | undefined) {
  return trimValue(value) === EMOJI_VARIANT;
}

export function isGoogleAvatarVariant(value: string | null | undefined) {
  return trimValue(value) === GOOGLE_VARIANT;
}

export function isValidAvatarEmoji(value: string | null | undefined) {
  const trimmed = trimValue(value);
  return Boolean(trimmed && EMOJI_REGEX.test(trimmed));
}

export function getAvatarVariantOptions(kind: AvatarKind) {
  return [...getVariantOptions(kind)];
}

export function getAvatarEmojiCatalog(kind: AvatarKind) {
  return kind === "player" ? [...PLAYER_EMOJIS] : [...GROUP_EMOJIS];
}

export function normalizeAvatarVariant(kind: AvatarKind, value: string | null | undefined) {
  const candidate = trimValue(value);

  if (!candidate) {
    return null;
  }

  return getVariantOptions(kind).includes(candidate as never) ? candidate : null;
}

export function buildStableAvatarSeed(...values: Array<string | null | undefined>) {
  const first = values.map(trimValue).find((value): value is string => Boolean(value));
  return first ?? "soliprode";
}

export function getAvatarFallbackVariant(
  kind: AvatarKind,
  seed: string,
  requestedVariant?: string | null,
) {
  const normalizedRequested = normalizeAvatarVariant(kind, requestedVariant);

  if (normalizedRequested) {
    return normalizedRequested;
  }

  const variants = getVariantOptions(kind);
  return variants[hashString(`${kind}:${seed}`) % variants.length];
}

export function buildPresetAvatarReference(input: {
  kind: AvatarKind;
  seed: string;
  variant: string;
}) {
  return `${PRESET_PREFIX}:${input.kind}:${input.variant}:${input.seed}`;
}

export function parsePresetAvatarReference(value: string | null | undefined): ParsedPresetAvatarReference | null {
  const trimmed = trimValue(value);

  if (!trimmed) {
    return null;
  }

  const [prefix, kind, variant, ...seedParts] = trimmed.split(":");

  if (prefix !== PRESET_PREFIX || (kind !== "player" && kind !== "group") || !variant || seedParts.length === 0) {
    return null;
  }

  const seed = seedParts.join(":").trim();
  const normalizedVariant = normalizeAvatarVariant(kind, variant);

  if (!seed || !normalizedVariant) {
    return null;
  }

  return {
    kind,
    seed,
    variant: normalizedVariant,
  };
}

export function buildEmojiAvatarChoice(emoji: string) {
  return `${EMOJI_PREFIX}:${encodeURIComponent(emoji)}`;
}

export function parseEmojiAvatarChoice(value: string | null | undefined) {
  const trimmed = trimValue(value);

  if (!trimmed || !trimmed.startsWith(`${EMOJI_PREFIX}:`)) {
    return null;
  }

  const decoded = decodeURIComponent(trimmed.slice(EMOJI_PREFIX.length + 1));
  return isValidAvatarEmoji(decoded) ? decoded : null;
}

export function getGoogleAvatarChoice() {
  return GOOGLE_SELECTION;
}

export function isGoogleAvatarChoice(value: string | null | undefined) {
  return trimValue(value) === GOOGLE_SELECTION;
}

export function isAutoAvatarChoice(value: string | null | undefined) {
  return trimValue(value) === AUTO_SELECTION;
}

export function getStoredAvatarChoice(input: {
  avatarUrl?: string | null;
  avatarSeed?: string | null;
  avatarVariant?: string | null;
}) {
  if (isEmojiAvatarVariant(input.avatarVariant) && isValidAvatarEmoji(input.avatarSeed)) {
    return buildEmojiAvatarChoice(input.avatarSeed!);
  }

  if (isGoogleAvatarVariant(input.avatarVariant)) {
    return GOOGLE_SELECTION;
  }

  const storedUrl = trimValue(input.avatarUrl);
  return storedUrl ?? AUTO_SELECTION;
}

export function buildGeneratedAvatarDataUrl(input: {
  kind: AvatarKind;
  label: string;
  seed: string;
  variant?: string | null;
}) {
  if (isEmojiAvatarVariant(input.variant) && isValidAvatarEmoji(input.seed)) {
    return encodeSvg(buildEmojiSvg({
      kind: input.kind,
      emoji: input.seed,
      seed: `${input.kind}:${input.seed}`,
    }));
  }

  const variant = getAvatarFallbackVariant(input.kind, input.seed, input.variant);
  const svg =
    input.kind === "player"
      ? buildPlayerSvg(input.label, input.seed, variant)
      : buildGroupSvg(input.label, input.seed, variant);

  return encodeSvg(svg);
}

export function resolveStoredAvatarUrl(input: {
  kind: AvatarKind;
  avatarUrl: string | null | undefined;
  label: string;
  seed: string;
  variant?: string | null;
}) {
  const preset = parsePresetAvatarReference(input.avatarUrl);

  if (preset && preset.kind === input.kind) {
    return buildGeneratedAvatarDataUrl({
      kind: input.kind,
      label: input.label,
      seed: preset.seed,
      variant: preset.variant,
    });
  }

  return trimValue(input.avatarUrl);
}

export function buildAvatarCandidateUrls(values: Array<string | null | undefined>) {
  return uniqueValues(values);
}
