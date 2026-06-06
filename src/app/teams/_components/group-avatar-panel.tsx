"use client";

import { AvatarPicker } from "@/components/avatar/avatar-picker";
import { GroupAvatar } from "@/components/groups/group-avatar";
import { updateGroupAvatarAction } from "@/app/groups/actions";
import {
  buildPresetAvatarReference,
  getAvatarVariantOptions,
} from "@/lib/avatar/identity";

type GroupAvatarPanelProps = {
  canEdit: boolean;
  currentAvatarChoice: string;
  fallbackAvatarUrl: string | null;
  groupId: string;
  label: string;
  seed: string;
  url: string | null;
  variant: string | null;
};

export function GroupAvatarPanel({
  canEdit,
  currentAvatarChoice,
  fallbackAvatarUrl,
  groupId,
  label,
  seed,
  url,
  variant,
}: GroupAvatarPanelProps) {
  const options = getAvatarVariantOptions("group").map((option) => ({
    caption:
      option === "shield"
        ? "Escudo"
        : option === "crest"
          ? "Cresta"
          : option === "banner"
            ? "Bandera"
            : option === "rivals"
              ? "Clasico"
              : option === "cup"
                ? "Copa"
                : "Club",
    kind: "group" as const,
    label,
    seed,
    value: buildPresetAvatarReference({
      kind: "group",
      seed: groupId,
      variant: option,
    }),
    variant: option,
  }));

  return (
    <div className="teams-group-avatar-panel">
      <GroupAvatar
        imageUrl={url}
        fallbackImageUrl={fallbackAvatarUrl}
        label={label}
        seed={seed}
        size="lg"
        variant={variant}
      />
      {canEdit ? (
        <AvatarPicker
          action={updateGroupAvatarAction}
          automaticOption={{
            caption: "Automatico del Team",
            kind: "group",
            label,
            seed,
            value: "auto",
            variant,
          }}
          currentValue={currentAvatarChoice}
          description="Elegi un escudo compacto para ranking, tarjetas y la vista principal del Team."
          hiddenFields={{ group_id: groupId }}
          options={options}
          triggerLabel="Cambiar escudo"
        />
      ) : null}
    </div>
  );
}
