function readConfiguredBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL?.trim() || null;
}

export const AUTH_NEXT_COOKIE_NAME = "soliprode_auth_next";

function isLocalOrigin(origin: string | null) {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export const GOOGLE_OAUTH_ERROR_MESSAGE =
  "No pudimos iniciar sesión con Google. Intentá nuevamente.";

export function hasConfiguredAuthBaseUrl() {
  return Boolean(readConfiguredBaseUrl());
}

export function normalizeAuthNextPath(nextPath: string | null | undefined) {
  return nextPath?.startsWith("/") ? nextPath : "/dashboard";
}

export function persistAuthNextPath(nextPath: string) {
  if (typeof document === "undefined") {
    return;
  }

  const safeNextPath = normalizeAuthNextPath(nextPath);
  document.cookie = `${AUTH_NEXT_COOKIE_NAME}=${encodeURIComponent(safeNextPath)}; Path=/; Max-Age=600; SameSite=Lax`;
}

export function clearPersistedAuthNextPath() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${AUTH_NEXT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function buildAuthCallbackUrl(nextPath = "/dashboard") {
  const configuredBaseUrl = readConfiguredBaseUrl();
  const fallbackBaseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : null;
  const preferredBaseUrl =
    process.env.NODE_ENV !== "production" && isLocalOrigin(fallbackBaseUrl)
      ? fallbackBaseUrl
      : configuredBaseUrl ?? fallbackBaseUrl;
  const baseUrl = preferredBaseUrl?.replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error("Missing auth callback base URL");
  }

  const safeNextPath = normalizeAuthNextPath(nextPath);
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;
}

export function logOAuthDevError(message: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.error(message, details);
  }
}
