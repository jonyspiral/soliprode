export type AvatarKind = "player" | "group";

type AvatarPalette = {
  background: string;
  accent: string;
  detail: string;
  text: string;
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

type ParsedPresetAvatarReference = {
  kind: AvatarKind;
  seed: string;
  variant: string;
};

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
  const initials = getPlayerInitials(label);

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
  const initials = getGroupInitials(label);

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

export function getAvatarVariantOptions(kind: AvatarKind) {
  return [...getVariantOptions(kind)];
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

export function buildGeneratedAvatarDataUrl(input: {
  kind: AvatarKind;
  label: string;
  seed: string;
  variant?: string | null;
}) {
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
