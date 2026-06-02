const FLAG_MAP: Record<string, string> = {
  argentina: "AR",
  arg: "AR",
  brasil: "BR",
  bra: "BR",
  espana: "ES",
  "españa": "ES",
  esp: "ES",
  francia: "FR",
  fra: "FR",
  mexico: "MX",
  "méxico": "MX",
  mex: "MX",
  alemania: "DE",
  ger: "DE",
  de: "DE",
};

function toFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function normalizeCountry(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

type CountryFlagProps = {
  country: string;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function CountryFlag({
  country,
  label,
  className = "",
  size = "md",
}: CountryFlagProps) {
  const normalized = normalizeCountry(country);
  const code = FLAG_MAP[normalized];
  const emoji = code ? toFlagEmoji(code) : "🏳";
  const sizeClass =
    size === "sm"
      ? "h-10 w-10 text-xl"
      : size === "lg"
        ? "h-16 w-16 text-3xl"
        : "h-14 w-14 text-2xl";

  return (
    <div
      className={[
        "flex items-center justify-center rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-surface-muted)] shadow-sm",
        sizeClass,
        className,
      ].join(" ")}
      aria-label={label ?? country}
      title={label ?? country}
    >
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}
