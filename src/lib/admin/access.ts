import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function requireAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("unauthenticated");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, public_alias, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.is_admin) {
    throw new Error("forbidden");
  }

  return {
    user,
    profile,
  };
}

export async function requireLinkedPromoterUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("unauthenticated");
  }

  const service = createServiceRoleSupabaseClient();
  const { data: promoter, error } = await service
    .from("promoters")
    .select("id, name, code, profile_id, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error || !promoter) {
    throw new Error("forbidden");
  }

  return {
    user,
    promoter,
  };
}
