"use client";

import { AvatarPicker } from "@/components/avatar/avatar-picker";
import { GroupAvatar } from "@/components/groups/group-avatar";
import { updateGroupAvatarAction } from "@/app/groups/actions";
import {
  buildEmojiAvatarChoice,
  buildPresetAvatarReference,
  getAvatarEmojiCatalog,
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
  const emojiOptions = getAvatarEmojiCatalog("group").map((option) => ({
    caption: option.emoji,
    category: option.category,
    detail: option.label,
    kind: "group" as const,
    label,
    recommended: option.recommended,
    seed: option.emoji,
    tab: "emoji" as const,
    value: buildEmojiAvatarChoice(option.emoji),
    variant: "emoji",
  }));
  const soliprodeOptions = getAvatarVariantOptions("group").map((option) => ({
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
    detail: "Avatar SoliProde",
    kind: "group" as const,
    label,
    seed,
    tab: "soliprode" as const,
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
          autoOption={{
            caption: "Automático del Team",
            detail: "Sin selección fija, SoliProde usa el escudo automático del Team.",
            kind: "group",
            label,
            seed,
            tab: "soliprode",
            value: "auto",
            variant,
          }}
          currentValue={currentAvatarChoice}
          description="Elegí un avatar compacto para ranking, tarjetas y la vista principal del Team."
          emojiOptions={emojiOptions}
          googleOption={null}
          hiddenFields={{ group_id: groupId }}
          soliprodeOptions={soliprodeOptions}
          triggerLabel="Cambiar escudo"
        />
      ) : null}
    </div>
  );
}
