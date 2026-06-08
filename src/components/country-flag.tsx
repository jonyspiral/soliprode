const SPECIAL_FLAG_CODES = new Set(["gb-eng", "gb-sct", "gb-wls", "gb-nir"]);

const COUNTRY_FLAG_FALLBACKS: Record<string, string> = {
  argentina: "AR",
  arg: "AR",
  brasil: "BR",
  bra: "BR",
  espana: "ES",
  esp: "ES",
  francia: "FR",
  fra: "FR",
  mexico: "MX",
  mex: "MX",
  alemania: "DE",
  ger: "DE",
  de: "DE",
  "estados unidos": "US",
  "united states": "US",
  usa: "US",
  canada: "CA",
  "south africa": "ZA",
  sudafrica: "ZA",
  inglaterra: "gb-eng",
  england: "gb-eng",
  escocia: "gb-sct",
  scotland: "gb-sct",
  gales: "gb-wls",
  wales: "gb-wls",
  "irlanda del norte": "gb-nir",
  "northern ireland": "gb-nir",
};

function normalizeCountry(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function normalizeIso2(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function resolveFlagCode(country: string, countryCode?: string | null) {
  const iso2 = normalizeIso2(countryCode);

  if (iso2) {
    return iso2.toLowerCase();
  }

  const normalizedCountry = normalizeCountry(country);
  const mappedCode = COUNTRY_FLAG_FALLBACKS[normalizedCountry];

  if (!mappedCode) {
    return null;
  }

  const mappedIso2 = normalizeIso2(mappedCode);

  if (mappedIso2) {
    return mappedIso2.toLowerCase();
  }

  return SPECIAL_FLAG_CODES.has(mappedCode) ? mappedCode : null;
}

type CountryFlagProps = {
  country: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  emoji?: string | null;
  countryCode?: string | null;
};

export function CountryFlag({
  country,
  label,
  className = "",
  size = "md",
  emoji: _emoji,
  countryCode,
}: CountryFlagProps) {
  void _emoji;
  const flagCode = resolveFlagCode(country, countryCode);
  const sizeClass =
    size === "sm"
      ? "h-10 w-10"
      : size === "lg"
        ? "h-16 w-16"
        : "h-14 w-14";

  return (
    <div
      className={[
        "flex items-center justify-center rounded-md border-[1.5px] border-[var(--color-line)] bg-[var(--color-surface-muted)]",
        sizeClass,
        className,
      ].join(" ")}
      aria-label={label ?? country}
      title={label ?? country}
    >
      {flagCode ? (
        <span
          aria-hidden="true"
          className={[
            `fi fi-${flagCode}`,
            "block h-[72%] w-[72%] rounded-[2px] border border-black/10 bg-cover bg-center bg-no-repeat",
          ].join(" ")}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-[72%] w-[72%] items-center justify-center rounded-[2px] border border-[var(--color-line)] bg-[var(--color-surface)] text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]"
        >
          --
        </span>
      )}
    </div>
  );
}
