const previewSupabaseUrl = "https://qlldglsdgijekoiorvbc.supabase.co";
const previewSupabasePublishableKey = "sb_publishable_LU1E7GHY7p2MemxBTsrgdg_c1EE8x2o";

function isVercelPreview() {
  return process.env.VERCEL_ENV === "preview";
}

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (value) {
    return value;
  }

  if (isVercelPreview()) {
    return previewSupabaseUrl;
  }

  throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey() {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (publishableKey) {
    return publishableKey;
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (anonKey) {
    return anonKey;
  }

  if (isVercelPreview()) {
    return previewSupabasePublishableKey;
  }

  throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function hasSupabasePublishableKey() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      isVercelPreview(),
  );
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(getSupabaseServiceRoleKey());
}
