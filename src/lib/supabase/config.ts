import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

export function getSupabaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey() {
  const publishableKey = getOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (publishableKey) {
    return publishableKey;
  }

  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function hasSupabasePublishableKey() {
  return Boolean(
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
      getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function getSupabaseServiceRoleKey() {
  return getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(getSupabaseServiceRoleKey());
}
