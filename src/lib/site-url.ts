const CANONICAL_PRODUCTION_ORIGIN = "https://www.soliprode.com";
const CANONICAL_PRODUCTION_HOST = "www.soliprode.com";
const LEGACY_PRODUCTION_HOSTS = new Set(["soliprode.com"]);

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase();
}

export function normalizePublicSiteOrigin(origin: string | null | undefined) {
  if (!origin) {
    return null;
  }

  try {
    const url = new URL(origin);
    const hostname = normalizeHostname(url.hostname);

    if (hostname === CANONICAL_PRODUCTION_HOST || LEGACY_PRODUCTION_HOSTS.has(hostname)) {
      return CANONICAL_PRODUCTION_ORIGIN;
    }

    if (isLocalHostname(hostname)) {
      return trimTrailingSlash(url.origin);
    }

    return trimTrailingSlash(url.origin);
  } catch {
    return null;
  }
}

export function readConfiguredPublicSiteOrigin() {
  return normalizePublicSiteOrigin(
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim() || null,
  );
}

export function resolvePublicSiteOrigin(currentOrigin?: string | null) {
  const configuredOrigin = readConfiguredPublicSiteOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const normalizedCurrentOrigin = normalizePublicSiteOrigin(currentOrigin);

  if (normalizedCurrentOrigin) {
    return normalizedCurrentOrigin;
  }

  return process.env.NODE_ENV === "production" ? CANONICAL_PRODUCTION_ORIGIN : null;
}

export function getCanonicalProductionOrigin() {
  return CANONICAL_PRODUCTION_ORIGIN;
}

export function getCanonicalProductionUrl(pathAndSearch: string) {
  return `${CANONICAL_PRODUCTION_ORIGIN}${pathAndSearch.startsWith("/") ? pathAndSearch : `/${pathAndSearch}`}`;
}

export function isLegacyProductionHostname(hostname: string | null | undefined) {
  return Boolean(hostname && LEGACY_PRODUCTION_HOSTS.has(normalizeHostname(hostname)));
}
