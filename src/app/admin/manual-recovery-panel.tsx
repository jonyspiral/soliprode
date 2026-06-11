"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlayerAvatar } from "@/components/profile/player-avatar";
import { SurfaceCard } from "@/components/surface-card";
import {
  MANUAL_RECOVERY_TEMPLATE_OPTIONS,
  getDefaultManualRecoveryTemplateKey,
  type ManualRecoveryTemplateKey,
} from "@/lib/admin/manual-recovery-email";
import { getPlayerAvatarModel, getPlayerDisplayName } from "@/lib/player/identity";

type PreviewTemplate = {
  activationUrl: string;
  html: string;
  subject: string;
};

export type ManualRecoveryPanelRow = {
  profile: {
    id: string;
    full_name: string | null;
    public_alias: string | null;
    email: string | null;
    created_at: string;
    avatar_url: string | null;
    avatar_seed: string | null;
    avatar_variant: string | null;
  };
  participation: {
    id: string;
  } | null;
  promoterLabel: string | null;
  groupLabel: string | null;
  stateLabel: "Sin Pase" | "Pago pendiente" | "Pase activo" | "Revisión manual";
  paymentStatusLabel: string;
  latestPaymentAttemptLabel: string | null;
  canCreateDraft: boolean;
};

type ActionHandler = (formData: FormData) => void | Promise<void>;

type ManualRecoveryPanelProps = {
  adminEmail: string | null;
  brevoStatus: {
    batchLimit: number;
    configReady: boolean;
    senderEmail: string | null;
    senderName: string | null;
  };
  initialSelectedProfileIds: string[];
  initialTemplateKey: ManualRecoveryTemplateKey;
  initialTestContext: string | null;
  initialTestProof: string | null;
  previewTemplates: Record<ManualRecoveryTemplateKey, PreviewTemplate>;
  rows: ManualRecoveryPanelRow[];
  sendRealAction: ActionHandler;
  sendTestAction: ActionHandler;
  confirmParticipationAction: ActionHandler;
  rejectParticipationAction: ActionHandler;
};

function buildOriginLabel(row: ManualRecoveryPanelRow) {
  const parts = [];

  if (row.groupLabel) {
    parts.push(`Team: ${row.groupLabel}`);
  }

  if (row.promoterLabel) {
    parts.push(`Promoter: ${row.promoterLabel}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Sin promoter ni Team";
}

function encodeClientSelectionContext(profileIds: string[], templateKey: ManualRecoveryTemplateKey) {
  return btoa(
    JSON.stringify({
      profileIds: [...new Set(profileIds)].sort(),
      templateKey,
    }),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function DraftSelectionRow({
  row,
  checked,
  confirmParticipationAction,
  onToggle,
  rejectParticipationAction,
}: {
  row: ManualRecoveryPanelRow;
  checked: boolean;
  confirmParticipationAction: ActionHandler;
  onToggle: (checked: boolean) => void;
  rejectParticipationAction: ActionHandler;
}) {
  const profile = row.profile;
  const avatarModel = getPlayerAvatarModel(profile);
  const label = getPlayerDisplayName(profile);
  const hasEmail = Boolean(profile.email?.trim());

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <label className="mt-1 flex items-start">
            <input
              type="checkbox"
              name="profile_id"
              value={profile.id}
              checked={checked}
              disabled={!hasEmail || !row.canCreateDraft}
              onChange={(event) => {
                onToggle(event.target.checked);
              }}
              className="mt-1 h-4 w-4 rounded border-[var(--color-line)]"
            />
          </label>
          <PlayerAvatar
            imageUrl={avatarModel.avatarUrl}
            fallbackImageUrl={avatarModel.fallbackAvatarUrl}
            label={label}
            seed={avatarModel.avatarSeed}
            size="md"
            variant={avatarModel.avatarVariant}
          />
          <div className="grid gap-1">
            <p className="font-semibold text-[var(--color-ink)]">{label}</p>
            <p className="text-sm text-[var(--color-muted)]">
              Nombre: {profile.full_name ?? "Pendiente"} · Nickname: {profile.public_alias ?? "Pendiente"}
            </p>
            <p className="text-sm text-[var(--color-muted)]">Email: {profile.email ?? "Sin email"}</p>
            <p className="text-sm text-[var(--color-muted)]">
              Alta: {new Date(profile.created_at).toLocaleDateString("es-AR")} · Estado: {row.stateLabel}
            </p>
            <p className="text-sm text-[var(--color-muted)]">payment_status: {row.paymentStatusLabel}</p>
            {row.latestPaymentAttemptLabel ? (
              <p className="text-sm text-[var(--color-muted)]">Último intento: {row.latestPaymentAttemptLabel}</p>
            ) : null}
            <p className="text-sm text-[var(--color-muted)]">{buildOriginLabel(row)}</p>
            {!hasEmail ? <p className="text-sm text-[#93000a]">No se puede enviar: el perfil no tiene email.</p> : null}
          </div>
        </div>

        <div className="grid gap-2 lg:min-w-[190px]">
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
            {row.stateLabel}
          </span>
          {row.stateLabel === "Pago pendiente" && row.participation ? (
            <>
              <button
                type="submit"
                name="participation_id"
                value={row.participation.id}
                formAction={confirmParticipationAction}
                className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
              >
                Confirmar pago
              </button>
              <button
                type="submit"
                name="participation_id"
                value={row.participation.id}
                formAction={rejectParticipationAction}
                className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
              >
                Rechazar pago
              </button>
            </>
          ) : (
            <Link
              href="/activar-pase"
              className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
            >
              Ver activación
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function ManualRecoveryPanel({
  adminEmail,
  brevoStatus,
  confirmParticipationAction,
  initialSelectedProfileIds,
  initialTemplateKey,
  initialTestContext,
  initialTestProof,
  previewTemplates,
  rejectParticipationAction,
  rows,
  sendRealAction,
  sendTestAction,
}: ManualRecoveryPanelProps) {
  const eligibleRows = useMemo(
    () =>
      [...rows].sort((left, right) => {
        const leftPriority = left.stateLabel === "Pago pendiente" ? 0 : 1;
        const rightPriority = right.stateLabel === "Pago pendiente" ? 0 : 1;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return Date.parse(right.profile.created_at) - Date.parse(left.profile.created_at);
      }),
    [rows],
  );
  const defaultSelectedIds = useMemo(() => {
    if (initialSelectedProfileIds.length > 0) {
      return initialSelectedProfileIds;
    }

    return eligibleRows
      .filter((row) => row.canCreateDraft && row.profile.email?.trim())
      .map((row) => row.profile.id);
  }, [eligibleRows, initialSelectedProfileIds]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(defaultSelectedIds);
  const [templateKey, setTemplateKey] = useState<ManualRecoveryTemplateKey>(
    initialTemplateKey || getDefaultManualRecoveryTemplateKey(),
  );
  const [confirmRealSend, setConfirmRealSend] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedProfileIds), [selectedProfileIds]);
  const selectedRows = useMemo(
    () => eligibleRows.filter((row) => selectedSet.has(row.profile.id)),
    [eligibleRows, selectedSet],
  );
  const selectedRecipientsLabel = selectedRows.map((row) => {
    const name = row.profile.public_alias ?? row.profile.full_name ?? "Jugador";
    const email = row.profile.email ?? "Sin email";
    return `${name} <${email}>`;
  });
  const currentContext = useMemo(
    () => encodeClientSelectionContext(selectedProfileIds, templateKey),
    [selectedProfileIds, templateKey],
  );
  const hasMatchingTest = Boolean(initialTestProof && initialTestContext && currentContext === initialTestContext);
  const previewTemplate = previewTemplates[templateKey];
  const canSendTest = brevoStatus.configReady && Boolean(adminEmail) && selectedRows.length > 0;
  const canSendReal = canSendTest && hasMatchingTest && confirmRealSend;

  return (
    <SurfaceCard
      title="Registrados sin Pase"
      description="Bandeja operativa para previsualizar, probar y recién después enviar tandas reales por Brevo."
    >
      <form action={sendRealAction} className="grid gap-4">
        <input type="hidden" name="manual_recovery_test_proof" value={hasMatchingTest ? initialTestProof ?? "" : ""} />
        <div className="grid gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
          <div className="grid gap-1">
            <p className="font-semibold text-[var(--color-ink)]">Envío Brevo</p>
            {brevoStatus.configReady ? (
              <p className="text-sm text-[var(--color-muted)]">
                Sender listo: {brevoStatus.senderName ?? "Sender"} &lt;{brevoStatus.senderEmail ?? "sin email"}&gt;.
                Tanda máxima: {brevoStatus.batchLimit} correos.
              </p>
            ) : (
              <p className="text-sm text-[#93000a]">
                Faltan `BREVO_API_KEY`, `BREVO_SENDER_NAME` o `BREVO_SENDER_EMAIL`.
              </p>
            )}
            {adminEmail ? (
              <p className="text-sm text-[var(--color-muted)]">Las pruebas se envían a tu correo admin: {adminEmail}.</p>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,260px)_auto_auto] lg:items-end">
            <label className="grid gap-1 text-sm text-[var(--color-muted)]">
              <span className="font-semibold uppercase tracking-[0.08em]">Plantilla</span>
              <select
                name="template_key"
                value={templateKey}
                onChange={(event) => {
                  setTemplateKey(event.target.value as ManualRecoveryTemplateKey);
                  setConfirmRealSend(false);
                }}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none"
              >
                {MANUAL_RECOVERY_TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              formAction={sendTestAction}
              disabled={!canSendTest}
              className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60 lg:w-fit"
            >
              Enviar prueba a mi correo
            </button>

            <button
              type="submit"
              disabled={!canSendReal}
              className="inline-flex w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60 lg:w-fit"
            >
              Enviar tanda real
            </button>
          </div>

          <div className="grid gap-3 rounded-lg border border-dashed border-[var(--color-line)] bg-white/70 p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Preview obligatorio antes de enviar</p>
            <div className="grid gap-2 text-sm text-[var(--color-muted)]">
              <p>Plantilla actual: {MANUAL_RECOVERY_TEMPLATE_OPTIONS.find((option) => option.key === templateKey)?.label}</p>
              <p>Asunto: {previewTemplate.subject}</p>
              <p>
                Link final:{" "}
                <a href={previewTemplate.activationUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] underline">
                  {previewTemplate.activationUrl}
                </a>
              </p>
              <p>Destinatarios seleccionados: {selectedRows.length}</p>
              <p>La vista previa usa un saludo de ejemplo. El envío real personaliza nombre o nickname cuando exista.</p>
            </div>

            {selectedRecipientsLabel.length > 0 ? (
              <div className="grid gap-2">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Selección actual</p>
                <div className="max-h-48 overflow-auto rounded-lg border border-[var(--color-line)] bg-white p-3 text-sm text-[var(--color-muted)]">
                  <ul className="grid gap-1">
                    {selectedRecipientsLabel.map((recipient) => (
                      <li key={recipient}>{recipient}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#93000a]">Seleccioná al menos un destinatario para habilitar la prueba.</p>
            )}

            <div className="grid gap-2">
              <p className="text-sm font-semibold text-[var(--color-ink)]">HTML final</p>
              <iframe
                title="Vista previa email Brevo"
                srcDoc={previewTemplate.html}
                className="min-h-[540px] w-full rounded-lg border border-[var(--color-line)] bg-white"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-[var(--color-muted)]">
              <input
                type="checkbox"
                name="confirm_brevo_send"
                value="yes"
                checked={confirmRealSend}
                disabled={!hasMatchingTest}
                onChange={(event) => {
                  setConfirmRealSend(event.target.checked);
                }}
                className="mt-1 h-4 w-4 rounded border-[var(--color-line)]"
              />
              <span>
                Confirmo que revisé el preview, envié una prueba a mi correo y quiero disparar esta tanda real ahora.
              </span>
            </label>

            <p className="text-sm text-[var(--color-muted)]">
              {hasMatchingTest
                ? "Prueba válida detectada para esta misma selección y plantilla."
                : "La tanda real sigue bloqueada hasta que envíes una prueba con esta misma selección y plantilla."}
            </p>
          </div>

          <p className="text-sm text-[var(--color-muted)]">
            Brevo deja logs de envío por destinatario para evitar duplicados accidentales dentro de las últimas 24 horas.
          </p>
        </div>

        {eligibleRows.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            No hay jugadores en estados reintentables para este flujo ahora mismo.
          </p>
        ) : (
          <div className="grid gap-4">
            {eligibleRows.map((row) => (
              <DraftSelectionRow
                key={row.profile.id}
                row={row}
                checked={selectedSet.has(row.profile.id)}
                onToggle={(checked) => {
                  setSelectedProfileIds((current) => {
                    const next = new Set(current);

                    if (checked) {
                      next.add(row.profile.id);
                    } else {
                      next.delete(row.profile.id);
                    }

                    return [...next].sort();
                  });
                  setConfirmRealSend(false);
                }}
                confirmParticipationAction={confirmParticipationAction}
                rejectParticipationAction={rejectParticipationAction}
              />
            ))}
          </div>
        )}
      </form>
    </SurfaceCard>
  );
}
