"use client";

import { useActionState } from "react";
import { AvatarPicker } from "@/components/avatar/avatar-picker";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { SurfaceCard } from "@/components/surface-card";
import {
  updatePlayerAvatarAction,
  updateAccountDetailsAction,
  updateGameProfileAction,
} from "@/app/profile/actions";
import { initialProfileActionState } from "@/app/profile/state";
import {
  buildEmojiAvatarChoice,
  buildPresetAvatarReference,
  getAvatarEmojiCatalog,
  getGoogleAvatarChoice,
  getAvatarVariantOptions,
} from "@/lib/avatar/identity";

type ProfileEditorPanelsProps = {
  avatarSeed: string;
  avatarUrl: string | null;
  avatarVariant: string | null;
  currentAvatarChoice: string;
  email: string | null;
  fullName: string | null;
  hasGoogleAvatar: boolean;
  googleAvatarUrl: string | null;
  publicLabel: string;
  publicNickname: string;
  userId: string | null;
  whatsapp: string | null;
};

function FormMessage({
  message,
  status,
}: {
  message: string | null;
  status: "idle" | "error" | "success";
}) {
  if (!message || status === "idle") {
    return null;
  }

  const className =
    status === "success"
      ? "profile-feedback profile-feedback-success"
      : "profile-feedback profile-feedback-error";

  return <p className={className}>{message}</p>;
}

function SaveButton({
  idleLabel,
  pendingLabel,
  pending,
}: {
  idleLabel: string;
  pendingLabel: string;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="profile-save-button disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function ReadonlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3">
      <p className="profile-field-label">{label}</p>
      <p className="profile-readonly-value break-words">{value}</p>
    </div>
  );
}

export function ProfileEditorPanels({
  avatarSeed,
  avatarUrl,
  avatarVariant,
  currentAvatarChoice,
  email,
  fullName,
  hasGoogleAvatar,
  googleAvatarUrl,
  publicLabel,
  publicNickname,
  userId,
  whatsapp,
}: ProfileEditorPanelsProps) {
  const [gameState, gameAction, gamePending] = useActionState(
    updateGameProfileAction,
    initialProfileActionState,
  );
  const [accountState, accountAction, accountPending] = useActionState(
    updateAccountDetailsAction,
    initialProfileActionState,
  );
  const emojiOptions = getAvatarEmojiCatalog("player").map((option) => ({
    caption: option.emoji,
    category: option.category,
    detail: option.label,
    kind: "player" as const,
    label: publicLabel,
    recommended: option.recommended,
    seed: option.emoji,
    tab: "emoji" as const,
    value: buildEmojiAvatarChoice(option.emoji),
    variant: "emoji",
  }));
  const googleOption = hasGoogleAvatar
    ? {
        caption: "Usar foto de tu cuenta Google",
        detail: "Tu foto de Google queda como selección principal.",
        kind: "player" as const,
        label: publicLabel,
        seed: avatarSeed,
        tab: "google" as const,
        value: getGoogleAvatarChoice(),
        imageUrl: googleAvatarUrl,
      }
    : null;
  const soliprodeOptions = getAvatarVariantOptions("player").map((variant) => ({
    caption:
      variant === "stadium"
        ? "Estadio"
        : variant === "captain"
          ? "Capitán"
          : variant === "wing"
            ? "Banda"
            : variant === "goal"
              ? "Gol"
              : variant === "tribune"
                ? "Tribuna"
                : "Prode",
    detail: "Avatar SoliProde",
    kind: "player" as const,
    label: publicLabel,
    seed: avatarSeed,
    tab: "soliprode" as const,
    value: buildPresetAvatarReference({
      kind: "player",
      seed: userId ?? avatarSeed,
      variant,
    }),
    variant,
  }));

  return (
    <>
      <SurfaceCard
        title="Perfil de juego"
        description="Este es el nombre y la imagen que empujan tu identidad pública en Ranking, Team y Plantel."
      >
        <div className="profile-form">
          <div className="profile-avatar-panel">
            <PlayerAvatar
              imageUrl={avatarUrl}
              label={publicLabel}
              seed={avatarSeed}
              size="md"
              variant={avatarVariant}
            />
            <div className="profile-avatar-panel-copy">
              <p className="profile-field-label">Tu avatar</p>
              <p className="profile-avatar-value">
                {currentAvatarChoice.startsWith("emoji:")
                  ? "Emoji elegido como avatar principal"
                  : currentAvatarChoice === "google"
                    ? "Foto de Google elegida como avatar principal"
                    : currentAvatarChoice !== "auto"
                      ? "Avatar SoliProde elegido"
                      : hasGoogleAvatar
                        ? "Foto de Google como fallback"
                        : "Avatar generado del jugador"}
              </p>
              <p className="profile-avatar-copy">
                Elegí emoji, Google o un avatar SoliProde. Si algo falla, mantenemos un fallback limpio.
              </p>
            </div>
          </div>

          <AvatarPicker
            action={updatePlayerAvatarAction}
            autoOption={{
              caption: hasGoogleAvatar ? "Automático con Google" : "Automático SoliProde",
              detail: hasGoogleAvatar
                ? "Sin selección fija, usamos tu foto de Google cuando está disponible."
                : "Sin selección fija, usamos el avatar generado del juego.",
              kind: "player",
              label: publicLabel,
              seed: avatarSeed,
              tab: "soliprode",
              value: "auto",
              variant: avatarVariant,
            }}
            currentValue={currentAvatarChoice}
            description="Elegi un avatar compacto para que se vea bien en mobile, ranking y Team."
            emojiOptions={emojiOptions}
            googleOption={googleOption}
            showGoogleTab
            soliprodeOptions={soliprodeOptions}
            triggerLabel="Cambiar avatar"
          />
        </div>

        <form action={gameAction} className="profile-form">
          <label className="profile-field">
            <span className="profile-field-label">Tu nick de juego</span>
            <input
              name="game_nickname"
              type="text"
              minLength={3}
              maxLength={24}
              required
              defaultValue={publicNickname}
              className="profile-input"
            />
          </label>

          <p className="profile-field-help">
            Este nick es el que usamos para mostrarte públicamente dentro del torneo.
          </p>

          <FormMessage message={gameState.message} status={gameState.status} />

          <div className="profile-form-footer">
            <p className="profile-editor-support">
              Elegilo corto y claro para que se vea bien en mobile.
            </p>
            <SaveButton
              idleLabel="Guardar perfil de juego"
              pendingLabel="Guardando..."
              pending={gamePending}
            />
          </div>
        </form>
      </SurfaceCard>

      <SurfaceCard
        title="Datos de cuenta"
        description="Acá viven tus datos administrativos de login. No son tu identidad pública dentro del juego."
      >
        <form action={accountAction} className="profile-form">
          <div className="profile-stat-grid">
            <ReadonlyField label="Nombre de cuenta" value={fullName ?? "Pendiente"} />
            <ReadonlyField label="Email" value={email ?? "Sin email"} />
          </div>

          <label className="profile-field">
            <span className="profile-field-label">WhatsApp</span>
            <input
              name="whatsapp"
              type="tel"
              defaultValue={whatsapp ?? ""}
              placeholder="+54 9 11..."
              className="profile-input"
            />
          </label>

          <p className="profile-field-help">
            Es opcional. Podés dejarlo vacío para borrarlo.
          </p>

          <FormMessage message={accountState.message} status={accountState.status} />

          <div className="profile-form-actions">
            <SaveButton
              idleLabel="Guardar datos"
              pendingLabel="Guardando..."
              pending={accountPending}
            />
            <SignOutButton className="profile-secondary-button" />
          </div>
        </form>
      </SurfaceCard>
    </>
  );
}
