import { randomUUID } from "node:crypto";
import {
  buildManualRecoveryTemplateContent,
  MANUAL_RECOVERY_DUPLICATE_GUARD_WINDOW_MS,
  MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE,
  type ManualRecoveryRecipient,
  type ManualRecoveryTemplateKey,
} from "@/lib/admin/manual-recovery-email";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type RecentSendLogRow = {
  profile_id: string;
  template_key: ManualRecoveryTemplateKey;
  created_at: string;
};

type BrevoSendSuccessResponse = {
  messageId?: string;
};

type BrevoSendErrorResponse = {
  code?: string;
  message?: string;
};

type SendBatchResult = {
  batchId: string;
  sentCount: number;
  failedCount: number;
  skippedDuplicateCount: number;
  skippedMissingEmailCount: number;
  skippedIneligibleCount: number;
  failureMessages: string[];
};

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  return code === "42P01";
}

function hasBrevoKey() {
  return Boolean(getOptionalEnv("BREVO_API_KEY"));
}

function hasBrevoSender() {
  return Boolean(getOptionalEnv("BREVO_SENDER_NAME") && getOptionalEnv("BREVO_SENDER_EMAIL"));
}

function getBrevoApiKey() {
  return getRequiredEnv("BREVO_API_KEY");
}

function getBrevoSenderName() {
  return getRequiredEnv("BREVO_SENDER_NAME");
}

function getBrevoSenderEmail() {
  return getRequiredEnv("BREVO_SENDER_EMAIL");
}

function buildRecipientLabel(recipient: ManualRecoveryRecipient) {
  return recipient.nickname?.trim() || recipient.fullName?.trim() || recipient.email;
}

async function sendBrevoTransactionalEmail(params: {
  recipient: ManualRecoveryRecipient;
  templateKey: ManualRecoveryTemplateKey;
}) {
  const template = buildManualRecoveryTemplateContent(params.templateKey, params.recipient);
  const providerMessageId = await sendBrevoEmail({
    toEmail: params.recipient.email.trim(),
    toName: buildRecipientLabel(params.recipient),
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.plainText,
    tags: ["soliprode", "manual-recovery", params.templateKey],
  });

  return {
    providerMessageId,
    template,
  };
}

async function sendBrevoEmail(params: {
  toEmail: string;
  toName?: string | null;
  subject: string;
  htmlContent: string;
  textContent: string;
  tags: string[];
}) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": getBrevoApiKey(),
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: getBrevoSenderName(),
        email: getBrevoSenderEmail(),
      },
      to: [{ email: params.toEmail.trim(), name: params.toName?.trim() || params.toEmail.trim() }],
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
      tags: params.tags,
      replyTo: {
        email: getBrevoSenderEmail(),
        name: getBrevoSenderName(),
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as BrevoSendErrorResponse;
    throw new Error(payload.message || payload.code || "Brevo no aceptó el envío.");
  }

  const payload = (await response.json().catch(() => ({}))) as BrevoSendSuccessResponse;

  return payload.messageId ?? null;
}

export async function sendManualRecoveryBrevoTestEmail(params: {
  recipient: ManualRecoveryRecipient;
  templateKey: ManualRecoveryTemplateKey;
  adminEmail: string;
  adminName?: string | null;
}) {
  const template = buildManualRecoveryTemplateContent(params.templateKey, params.recipient);
  const providerMessageId = await sendBrevoEmail({
    toEmail: params.adminEmail,
    toName: params.adminName,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.plainText,
    tags: ["soliprode", "manual-recovery-test", params.templateKey],
  });

  return {
    providerMessageId,
    template,
  };
}

export function getBrevoAdminStatus() {
  return {
    configReady: hasBrevoKey() && hasBrevoSender(),
    senderName: getOptionalEnv("BREVO_SENDER_NAME"),
    senderEmail: getOptionalEnv("BREVO_SENDER_EMAIL"),
    batchLimit: MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE,
  };
}

async function getRecentSendLogs(params: {
  profileIds: string[];
  templateKey: ManualRecoveryTemplateKey;
}) {
  if (params.profileIds.length === 0) {
    return new Map<string, RecentSendLogRow>();
  }

  const service = createServiceRoleSupabaseClient();
  const since = new Date(Date.now() - MANUAL_RECOVERY_DUPLICATE_GUARD_WINDOW_MS).toISOString();
  const { data, error } = await service
    .from("admin_email_send_logs")
    .select("profile_id, template_key, created_at")
    .in("profile_id", params.profileIds)
    .eq("template_key", params.templateKey)
    .eq("status", "sent")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return new Map<string, RecentSendLogRow>();
    }

    throw error;
  }

  const recentMap = new Map<string, RecentSendLogRow>();

  for (const row of (data ?? []) as RecentSendLogRow[]) {
    if (!recentMap.has(row.profile_id)) {
      recentMap.set(row.profile_id, row);
    }
  }

  return recentMap;
}

async function insertSendLog(params: {
  batchId: string;
  adminProfileId: string;
  provider: "brevo";
  templateKey: ManualRecoveryTemplateKey;
  recipient: ManualRecoveryRecipient;
  status: "sent" | "failed" | "skipped_duplicate" | "skipped_missing_email" | "skipped_ineligible";
  providerMessageId?: string | null;
  errorMessage?: string | null;
}) {
  const service = createServiceRoleSupabaseClient();
  const { error } = await service.from("admin_email_send_logs").insert({
    batch_id: params.batchId,
    admin_profile_id: params.adminProfileId,
    profile_id: params.recipient.profileId,
    participation_id: params.recipient.participationId,
    payment_attempt_id: params.recipient.paymentAttemptId,
    provider: params.provider,
    template_key: params.templateKey,
    recipient_email: params.recipient.email.trim(),
    sender_email: getOptionalEnv("BREVO_SENDER_EMAIL"),
    status: params.status,
    provider_message_id: params.providerMessageId ?? null,
    error_message: params.errorMessage ?? null,
    sent_at: params.status === "sent" ? new Date().toISOString() : null,
    metadata: {
      promoter: params.recipient.promoterLabel,
      group: params.recipient.groupLabel,
      payment_status: params.recipient.paymentStatus,
      payment_attempt_status: params.recipient.paymentAttemptStatus,
      payment_attempt_provider: params.recipient.paymentAttemptProvider,
    },
  });

  if (error) {
    throw error;
  }
}

export async function sendManualRecoveryBrevoBatch(params: {
  adminProfileId: string;
  templateKey: ManualRecoveryTemplateKey;
  recipients: ManualRecoveryRecipient[];
}) {
  const status = getBrevoAdminStatus();

  if (!status.configReady) {
    throw new Error("Faltan BREVO_API_KEY, BREVO_SENDER_NAME o BREVO_SENDER_EMAIL.");
  }

  if (params.recipients.length > MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE) {
    throw new Error(`La tanda supera el máximo permitido de ${MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE} correos.`);
  }

  const batchId = randomUUID();
  const recentLogs = await getRecentSendLogs({
    profileIds: params.recipients.map((recipient) => recipient.profileId),
    templateKey: params.templateKey,
  });
  let sentCount = 0;
  let failedCount = 0;
  let skippedDuplicateCount = 0;
  let skippedMissingEmailCount = 0;
  let skippedIneligibleCount = 0;
  const failureMessages: string[] = [];

  for (const recipient of params.recipients) {
    if (!recipient.email.trim()) {
      skippedMissingEmailCount += 1;
      await insertSendLog({
        batchId,
        adminProfileId: params.adminProfileId,
        provider: "brevo",
        templateKey: params.templateKey,
        recipient,
        status: "skipped_missing_email",
        errorMessage: "Perfil sin email.",
      });
      continue;
    }

    if (!recipient.participationId) {
      skippedIneligibleCount += 1;
      await insertSendLog({
        batchId,
        adminProfileId: params.adminProfileId,
        provider: "brevo",
        templateKey: params.templateKey,
        recipient,
        status: "skipped_ineligible",
        errorMessage: "Perfil sin participación elegible.",
      });
      continue;
    }

    if (recentLogs.has(recipient.profileId)) {
      skippedDuplicateCount += 1;
      await insertSendLog({
        batchId,
        adminProfileId: params.adminProfileId,
        provider: "brevo",
        templateKey: params.templateKey,
        recipient,
        status: "skipped_duplicate",
        errorMessage: "Ya se envió esta plantilla dentro de la ventana anti-duplicado.",
      });
      continue;
    }

    try {
      const sent = await sendBrevoTransactionalEmail({
        recipient,
        templateKey: params.templateKey,
      });
      await insertSendLog({
        batchId,
        adminProfileId: params.adminProfileId,
        provider: "brevo",
        templateKey: params.templateKey,
        recipient,
        status: "sent",
        providerMessageId: sent.providerMessageId,
      });
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      const message = error instanceof Error ? error.message : "No pudimos enviar el correo con Brevo.";
      failureMessages.push(`${buildRecipientLabel(recipient)}: ${message}`);
      await insertSendLog({
        batchId,
        adminProfileId: params.adminProfileId,
        provider: "brevo",
        templateKey: params.templateKey,
        recipient,
        status: "failed",
        errorMessage: message,
      });
    }
  }

  return {
    batchId,
    sentCount,
    failedCount,
    skippedDuplicateCount,
    skippedMissingEmailCount,
    skippedIneligibleCount,
    failureMessages,
  } satisfies SendBatchResult;
}

export function buildBrevoBatchNotice(result: Awaited<ReturnType<typeof sendManualRecoveryBrevoBatch>>) {
  const parts = [`${result.sentCount} correo(s) enviados`];

  if (result.skippedDuplicateCount > 0) {
    parts.push(`${result.skippedDuplicateCount} omitido(s) por duplicado reciente`);
  }

  if (result.skippedMissingEmailCount > 0) {
    parts.push(`${result.skippedMissingEmailCount} sin email`);
  }

  if (result.skippedIneligibleCount > 0) {
    parts.push(`${result.skippedIneligibleCount} ineligible(s)`);
  }

  if (result.failedCount > 0) {
    parts.push(`${result.failedCount} con error`);
  }

  return parts.join(" · ");
}

export function buildBrevoBatchError(result: Awaited<ReturnType<typeof sendManualRecoveryBrevoBatch>>) {
  if (result.failedCount === 0) {
    return null;
  }

  return result.failureMessages.slice(0, 3).join(" | ");
}
