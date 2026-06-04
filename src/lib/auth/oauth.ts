function readConfiguredBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL?.trim() || null;
}

export const GOOGLE_OAUTH_ERROR_MESSAGE =
  "No pudimos iniciar sesión con Google. Intentá nuevamente.";

export function hasConfiguredAuthBaseUrl() {
  return Boolean(readConfiguredBaseUrl());
}

export function normalizeAuthNextPath(nextPath: string | null | undefined) {
  return nextPath?.startsWith("/") ? nextPath : "/dashboard";
}

export function buildAuthCallbackUrl(nextPath = "/dashboard") {
  const configuredBaseUrl = readConfiguredBaseUrl();
  const fallbackBaseUrl =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : null;
  const baseUrl = (configuredBaseUrl ?? fallbackBaseUrl)?.replace(/\/+$/, "");

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
