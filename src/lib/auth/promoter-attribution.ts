export const PROMOTER_COOKIE_NAME = "sp_promoter_code";

function cleanPromoterCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, "").toUpperCase();
  return normalized || null;
}

export function normalizePromoterCode(value: string | null | undefined) {
  return cleanPromoterCode(value);
}

export function readPromoterCodeFromSearchParams(
  params:
    | URLSearchParams
    | {
        get(name: string): string | null | undefined;
      },
) {
  return cleanPromoterCode(params.get("p") ?? params.get("promoter"));
}

export function appendPromoterQuery(path: string, promoterCode: string | null) {
  const code = cleanPromoterCode(promoterCode);

  if (!code) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}p=${encodeURIComponent(code)}`;
}
