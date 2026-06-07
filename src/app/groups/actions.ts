"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildPresetAvatarReference,
  buildStableAvatarSeed,
  normalizeAvatarVariant,
  parseEmojiAvatarChoice,
  parsePresetAvatarReference,
} from "@/lib/avatar/identity";
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

function resolveGroupsReturnPath(rawValue: FormDataEntryValue | null) {
  const value = typeof rawValue === "string" ? rawValue.trim() : "";

  if (!value.startsWith("/")) {
    return "/groups";
  }

  if (value.startsWith("/teams")) {
    return value;
  }

  return value.startsWith("/groups") ? value : "/groups";
}

function redirectToTeamSurface(
  returnPath: string,
  params: Record<string, string | null | undefined>,
) {
  if (returnPath.startsWith("/groups")) {
    redirectToGroups(params);
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.trim()) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  const basePath = returnPath.startsWith("/teams") ? returnPath.split("?")[0] : "/teams";
  redirect(queryString ? `${basePath}?${queryString}` : basePath);
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

async function ensureAuthenticatedUser(returnPath: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  return user;
}

async function ensureParticipationId(profileId: string) {
  const service = createServiceRoleSupabaseClient();
  const { data } = await service
    .from("participations")
    .select("id, created_at, payment_status")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    pickPrimaryParticipation((data ?? []) as Array<{ id: string; created_at: string; payment_status: string }>).participation ??
    null
  );
}

async function buildUniqueGroupIdentity(groupName: string) {
  const service = createServiceRoleSupabaseClient();
  const baseSlug = slugifyGroupName(groupName) || "team";

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
  revalidatePath("/teams");
  revalidatePath("/rankings");
  revalidatePath("/dashboard");
}

export async function updateGroupAvatarAction(
  _prevState: { message: string | null; status: "idle" | "error" | "success" },
  formData: FormData,
) {
  try {
    const user = await ensureAuthenticatedUser("/groups");
    const groupId = String(formData.get("group_id") ?? "").trim();
    const avatarChoice = String(formData.get("avatar_choice") ?? "").trim();

    if (!groupId) {
      return {
        status: "error" as const,
        message: "No encontramos el Team para cambiarle el escudo.",
      };
    }

    const service = createServiceRoleSupabaseClient();
    const { data: group } = await service
      .from("groups")
      .select("id, owner_profile_id")
      .eq("id", groupId)
      .maybeSingle();

    if (!group || group.owner_profile_id !== user.id) {
      return {
        status: "error" as const,
        message: "Solo el Capitan puede cambiar el escudo del Team.",
      };
    }

    let avatarUrl: string | null = null;
    let avatarVariant: string | null = null;
    let avatarSeed = buildStableAvatarSeed(groupId, "group");

    if (avatarChoice && avatarChoice !== "auto") {
      const emojiChoice = parseEmojiAvatarChoice(avatarChoice);

      if (emojiChoice) {
        avatarVariant = "emoji";
        avatarSeed = emojiChoice;
      } else {
        const presetReference = parsePresetAvatarReference(avatarChoice);

        if (!presetReference || presetReference.kind !== "group") {
          return {
            status: "error" as const,
            message: "Ese escudo no es valido para Team.",
          };
        }

        avatarVariant = normalizeAvatarVariant("group", presetReference.variant);
        avatarSeed = buildStableAvatarSeed(presetReference.seed, groupId, "group");
        avatarUrl = buildPresetAvatarReference({
          kind: "group",
          seed: avatarSeed,
          variant: avatarVariant ?? presetReference.variant,
        });
      }
    }

    const { error } = await service
      .from("groups")
      .update({
        avatar_seed: avatarSeed,
        avatar_url: avatarUrl,
        avatar_variant: avatarVariant,
      })
      .eq("id", groupId);

    if (error) {
      return {
        status: "error" as const,
        message: "No pudimos guardar el escudo del Team ahora.",
      };
    }

    revalidateGroupSurfaces();

    return {
      status: "success" as const,
      message:
        avatarVariant === "emoji"
          ? "El avatar del Team quedo actualizado."
          : avatarUrl
            ? "El escudo del Team quedo actualizado."
            : "El Team volvio al escudo automatico.",
    };
  } catch (error) {
    return {
      status: "error" as const,
      message:
        error instanceof Error
          ? error.message
          : "No pudimos guardar el escudo del Team ahora.",
    };
  }
}

export async function createGroupAction(formData: FormData) {
  const returnPath = resolveGroupsReturnPath(formData.get("return_to"));
  const user = await ensureAuthenticatedUser(returnPath);
  const name = String(formData.get("group_name") ?? "").trim().replace(/\s+/g, " ");

  if (name.length < 3) {
    redirectToTeamSurface(returnPath, {
      error: "El nombre del Team tiene que tener al menos 3 caracteres.",
    });
  }

  const participation = await ensureParticipationId(user.id);

  if (!participation) {
    redirectToTeamSurface(returnPath, {
      error: "No pudimos encontrar tu inscripción para crear el Team.",
    });
  }

  const currentParticipation = participation!;

  if (currentParticipation.payment_status !== "paid") {
    redirect("/activar-pase");
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
    redirectToTeamSurface(returnPath, {
      error: "No pudimos crear tu Team ahora. Intentá de nuevo.",
    });
  }

  const insertedGroupId = insertedGroup?.id;

  if (!insertedGroupId) {
    redirectToTeamSurface(returnPath, {
      error: "No pudimos crear tu Team ahora. Intentá de nuevo.",
    });
  }

  const { error: participationUpdateError } = await service
    .from("participations")
    .update({ group_id: insertedGroupId })
    .eq("id", currentParticipation.id);

  if (participationUpdateError) {
    redirectToTeamSurface(returnPath, {
      error: "Creamos el Team, pero no pudimos dejarlo como tu Team principal.",
    });
  }

  revalidateGroupSurfaces();
  redirectToTeamSurface(returnPath, {
    notice: "Team creado. Ya quedó como tu Team principal.",
  });
}

export async function joinGroupAction(formData: FormData) {
  const returnPath = resolveGroupsReturnPath(formData.get("return_to"));
  const user = await ensureAuthenticatedUser(returnPath);
  const inviteCode = normalizeInviteCode(String(formData.get("invite_code") ?? ""));
  const confirmReplace = String(formData.get("confirm_replace") ?? "") === "1";

  if (!inviteCode) {
    redirectToTeamSurface(returnPath, {
      error: "Pegá un código o link válido para unirte al Team.",
    });
  }

  const participation = await ensureParticipationId(user.id);

  if (!participation) {
    redirectToTeamSurface(returnPath, {
      error: "No pudimos encontrar tu inscripción para sumarte al Team.",
    });
  }

  const currentParticipation = participation!;

  if (currentParticipation.payment_status !== "paid") {
    redirect("/activar-pase");
  }

  const service = createServiceRoleSupabaseClient();
  const { data: group } = await service
    .from("groups")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!group) {
    redirectToTeamSurface(returnPath, {
      code: inviteCode,
      error: "Ese código no existe o ya no está disponible.",
    });
  }

  const targetGroupId = group?.id;
  const targetGroupName = group?.name ?? "El Team";

  if (!targetGroupId) {
    redirectToTeamSurface(returnPath, {
      code: inviteCode,
      error: "Ese código no existe o ya no está disponible.",
    });
  }

  const { data: participationRow } = await service
    .from("participations")
    .select("group_id")
    .eq("id", currentParticipation.id)
    .maybeSingle();

  const currentGroupId =
    participationRow && typeof participationRow.group_id === "string" ? participationRow.group_id : null;

  if (currentGroupId && currentGroupId === targetGroupId) {
    redirectToTeamSurface(returnPath, {
      code: inviteCode,
      notice: `Ya formás parte de ${targetGroupName}.`,
    });
  }

  if (currentGroupId && currentGroupId !== targetGroupId && !confirmReplace) {
    redirectToTeamSurface(returnPath, {
      code: inviteCode,
      error: `Ya tenés un Team. Confirmá el cambio para sumarte a ${targetGroupName}.`,
    });
  }

  const { error } = await service
    .from("participations")
    .update({ group_id: targetGroupId })
    .eq("id", currentParticipation.id);

  if (error) {
    redirectToTeamSurface(returnPath, {
      code: inviteCode,
      error: "No pudimos sumarte al Team ahora. Intentá de nuevo.",
    });
  }

  revalidateGroupSurfaces();
  redirectToTeamSurface(returnPath, {
    notice: `${targetGroupName} ya quedó como tu Team principal.`,
  });
}
