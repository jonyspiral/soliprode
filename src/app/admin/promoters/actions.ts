"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/access";
import {
  buildPromoterCodeFromName,
  normalizePromoterStatus,
  normalizePromoterWhatsapp,
  resolveUniquePromoterCode,
} from "@/lib/promoters/admin";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

function readOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

async function resolveLinkedProfileId(linkedProfileEmail: string | null) {
  if (!linkedProfileEmail) {
    return null;
  }

  const service = createServiceRoleSupabaseClient();
  const { data: profile, error } = await service
    .from("profiles")
    .select("id")
    .ilike("email", linkedProfileEmail)
    .maybeSingle();

  if (error || !profile) {
    throw new Error("linked_profile_not_found");
  }

  return profile.id;
}

function redirectToPromoters(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  redirect(queryString ? `/admin/promoters?${queryString}` : "/admin/promoters");
}

function revalidatePromoterSurfaces() {
  revalidatePath("/admin");
  revalidatePath("/admin/promoters");
}

export async function savePromoterAction(formData: FormData) {
  await requireAdminUser();

  const promoterId = readOptionalString(formData, "promoter_id");
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const rawCode = readOptionalString(formData, "code");
  const email = readOptionalString(formData, "email");
  const whatsapp = normalizePromoterWhatsapp(readOptionalString(formData, "whatsapp"));
  const status = normalizePromoterStatus(String(formData.get("status") ?? "active"));
  const notes = readOptionalString(formData, "notes");
  const linkedProfileEmail = readOptionalString(formData, "linked_profile_email");

  if (name.length < 3) {
    redirectToPromoters({
      edit: promoterId,
      error: "El nombre del Promoter tiene que tener al menos 3 caracteres.",
    });
  }

  const code = await resolveUniquePromoterCode({
    name,
    code: rawCode ?? buildPromoterCodeFromName(name),
    excludeId: promoterId,
  });

  const service = createServiceRoleSupabaseClient();
  let profileId: string | null = null;

  try {
    profileId = await resolveLinkedProfileId(linkedProfileEmail);
  } catch (error) {
    if (error instanceof Error && error.message === "linked_profile_not_found") {
      redirectToPromoters({
        edit: promoterId,
        error: "No encontramos un usuario registrado con ese email para vincular al Promoter.",
      });
    }

    throw error;
  }

  const payload = {
    name,
    code,
    email,
    whatsapp,
    status,
    notes,
    profile_id: profileId,
  };

  if (promoterId) {
    const { error } = await service.from("promoters").update(payload).eq("id", promoterId);

    if (error) {
      redirectToPromoters({
        edit: promoterId,
        error: "No pudimos guardar ese Promoter ahora.",
      });
    }

    revalidatePromoterSurfaces();
    redirectToPromoters({
      notice: "Promoter actualizado.",
      view: promoterId,
    });
  }

  const { data: insertedPromoter, error } = await service
    .from("promoters")
    .insert(payload)
    .select("id")
    .single();

  if (error || !insertedPromoter) {
    redirectToPromoters({
      error: "No pudimos crear ese Promoter ahora.",
    });
  }

  const insertedPromoterId = insertedPromoter?.id;

  if (!insertedPromoterId) {
    redirectToPromoters({
      error: "No pudimos crear ese Promoter ahora.",
    });
  }

  revalidatePromoterSurfaces();
  redirectToPromoters({
    notice: "Promoter creado.",
    view: insertedPromoterId,
  });
}

export async function togglePromoterStatusAction(formData: FormData) {
  await requireAdminUser();

  const promoterId = readOptionalString(formData, "promoter_id");
  const nextStatus = normalizePromoterStatus(String(formData.get("next_status") ?? "active"));

  if (!promoterId) {
    redirectToPromoters({
      error: "Falta el Promoter a actualizar.",
    });
  }

  const service = createServiceRoleSupabaseClient();
  const { error } = await service
    .from("promoters")
    .update({ status: nextStatus })
    .eq("id", promoterId);

  if (error) {
    redirectToPromoters({
      error: "No pudimos cambiar el estado del Promoter.",
      view: promoterId,
    });
  }

  revalidatePromoterSurfaces();
  redirectToPromoters({
    notice: nextStatus === "active" ? "Promoter activado." : "Promoter desactivado.",
    view: promoterId,
  });
}
