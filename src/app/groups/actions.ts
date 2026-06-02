"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeInviteCode } from "@/lib/groups/competition";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

function redirectToGroups(params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  redirect(queryString ? `/groups?${queryString}` : "/groups");
}

function slugifyGroupName(groupName: string) {
  return groupName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function buildInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function ensureAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/groups");
  }

  return user;
}

async function ensureParticipationId(profileId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data } = await service
    .from("participations")
    .select("id, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(2);

  return pickPrimaryParticipation((data ?? []) as Array<{ id: string; created_at: string }>).participation?.id ?? null;
}

async function buildUniqueGroupIdentity(groupName: string) {
  const service = createServiceRoleSupabaseClient();
  const baseSlug = slugifyGroupName(groupName) || "grupo";

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${buildInviteCode().toLowerCase().slice(0, 4)}`;
    const inviteCode = buildInviteCode();

    const [{ data: slugMatch }, { data: inviteMatch }] = await Promise.all([
      service.from("groups").select("id").eq("slug", slug).maybeSingle(),
      service.from("groups").select("id").eq("invite_code", inviteCode).maybeSingle(),
    ]);

    if (!slugMatch && !inviteMatch) {
      return { slug, inviteCode };
    }
  }

  throw new Error("group_identity_generation_failed");
}

function revalidateGroupSurfaces() {
  revalidatePath("/groups");
  revalidatePath("/rankings");
  revalidatePath("/dashboard");
}

export async function createGroupAction(formData: FormData) {
  const user = await ensureAuthenticatedUser();
  const name = String(formData.get("group_name") ?? "").trim().replace(/\s+/g, " ");

  if (name.length < 3) {
    redirectToGroups({
      error: "El nombre del grupo tiene que tener al menos 3 caracteres.",
    });
  }

  const participationId = await ensureParticipationId(user.id);

  if (!participationId) {
    redirectToGroups({
      error: "No pudimos encontrar tu inscripción para crear el grupo.",
    });
  }

  const { slug, inviteCode } = await buildUniqueGroupIdentity(name);
  const service = createServiceRoleSupabaseClient();

  const { data: insertedGroup, error: groupInsertError } = await service
    .from("groups")
    .insert({
      community_id: null,
      name,
      slug,
      owner_profile_id: user.id,
      visibility: "public",
      invite_code: inviteCode,
    })
    .select("id")
    .single();

  if (groupInsertError || !insertedGroup) {
    redirectToGroups({
      error: "No pudimos crear tu grupo ahora. Intentá de nuevo.",
    });
  }

  const insertedGroupId = insertedGroup?.id;

  if (!insertedGroupId) {
    redirectToGroups({
      error: "No pudimos crear tu grupo ahora. Intentá de nuevo.",
    });
  }

  const { error: participationUpdateError } = await service
    .from("participations")
    .update({ group_id: insertedGroupId })
    .eq("id", participationId);

  if (participationUpdateError) {
    redirectToGroups({
      error: "Creamos el grupo, pero no pudimos dejarlo como tu grupo principal.",
    });
  }

  revalidateGroupSurfaces();
  redirectToGroups({
    notice: "Grupo creado. Ya quedó como tu grupo principal.",
  });
}

export async function joinGroupAction(formData: FormData) {
  const user = await ensureAuthenticatedUser();
  const inviteCode = normalizeInviteCode(String(formData.get("invite_code") ?? ""));

  if (!inviteCode) {
    redirectToGroups({
      error: "Pegá un código o link válido para unirte al grupo.",
    });
  }

  const participationId = await ensureParticipationId(user.id);

  if (!participationId) {
    redirectToGroups({
      error: "No pudimos encontrar tu inscripción para sumarte al grupo.",
    });
  }

  const service = createServiceRoleSupabaseClient();
  const { data: group } = await service
    .from("groups")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!group) {
    redirectToGroups({
      code: inviteCode,
      error: "Ese código no existe o ya no está disponible.",
    });
  }

  const targetGroupId = group?.id;
  const targetGroupName = group?.name ?? "El grupo";

  if (!targetGroupId) {
    redirectToGroups({
      code: inviteCode,
      error: "Ese código no existe o ya no está disponible.",
    });
  }

  const { error } = await service
    .from("participations")
    .update({ group_id: targetGroupId })
    .eq("id", participationId);

  if (error) {
    redirectToGroups({
      code: inviteCode,
      error: "No pudimos sumarte al grupo ahora. Intentá de nuevo.",
    });
  }

  revalidateGroupSurfaces();
  redirectToGroups({
    notice: `${targetGroupName} ya quedó como tu grupo principal.`,
  });
}
