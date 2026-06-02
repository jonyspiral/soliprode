import { getBaseUrl } from "@/lib/payments/config";

export function buildAuthCallbackUrl(nextPath = "/dashboard") {
  const baseUrl = getBaseUrl();
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/dashboard";
  return `${baseUrl}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;
}
