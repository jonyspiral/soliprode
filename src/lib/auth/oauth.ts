function readConfiguredBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL?.trim() || null;
}

export function hasConfiguredAuthBaseUrl() {
  return Boolean(readConfiguredBaseUrl());
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

  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/dashboard";
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;
}
