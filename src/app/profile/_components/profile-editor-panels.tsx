"use client";

import { useActionState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { SurfaceCard } from "@/components/surface-card";
import {
  updateAccountDetailsAction,
  updateGameProfileAction,
} from "@/app/profile/actions";
import { initialProfileActionState } from "@/app/profile/state";

type ProfileEditorPanelsProps = {
  avatarUrl: string | null;
  email: string | null;
  fullName: string | null;
  hasAvatarImage: boolean;
  publicLabel: string;
  publicNickname: string;
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
  avatarUrl,
  email,
  fullName,
  hasAvatarImage,
  publicLabel,
  publicNickname,
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

  return (
    <>
      <SurfaceCard
        title="Perfil de juego"
        description="Este es el nombre y la imagen que empujan tu identidad pública en Ranking, Team y Plantel."
      >
        <form action={gameAction} className="profile-form">
          <div className="profile-avatar-panel">
            <PlayerAvatar imageUrl={avatarUrl} label={publicLabel} size="md" />
            <div className="profile-avatar-panel-copy">
              <p className="profile-field-label">Avatar</p>
              <p className="profile-avatar-value">
                {hasAvatarImage ? "Foto de Google" : "Iniciales del jugador"}
              </p>
              <p className="profile-avatar-copy">
                {hasAvatarImage
                  ? "Usamos tu foto del login actual."
                  : "Cuando no hay foto disponible, mostramos tus iniciales."}
              </p>
            </div>
          </div>

          <label className="profile-field">
            <span className="profile-field-label">Nick de juego</span>
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
