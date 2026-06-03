export const NO_ZONE_KEY = "__no_zone__";

export function formatZoneLabel(groupCode: string | null | undefined) {
  const cleanCode = groupCode?.trim().toUpperCase();
  return cleanCode ? `Zona ${cleanCode}` : "Sin zona";
}

export function normalizeZoneCode(value: string | null | undefined) {
  const cleanValue = value?.trim().toUpperCase();

  if (!cleanValue || !/^[A-L]$/.test(cleanValue)) {
    return null;
  }

  return cleanValue;
}
