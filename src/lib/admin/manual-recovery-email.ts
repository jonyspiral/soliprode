import { getCanonicalProductionUrl, resolvePublicSiteOrigin } from "@/lib/site-url";

export const MANUAL_RECOVERY_TEMPLATE_OPTIONS = [
  { key: "prizes_worldcup", label: "Premios + Mundial" },
  { key: "payment_issue", label: "Problema de pago" },
  { key: "solidarity", label: "Solidaridad" },
] as const;

export type ManualRecoveryTemplateKey = (typeof MANUAL_RECOVERY_TEMPLATE_OPTIONS)[number]["key"];

export type ManualRecoveryRecipient = {
  profileId: string;
  participationId: string | null;
  paymentAttemptId: string | null;
  email: string;
  fullName: string | null;
  nickname: string | null;
  promoterLabel: string | null;
  groupLabel: string | null;
  paymentStatus: string | null;
  paymentAttemptStatus: string | null;
  paymentAttemptProvider: string | null;
};

export const RETRYABLE_MANUAL_RECOVERY_PAYMENT_STATUSES = new Set([
  "pending",
  "payment_started",
  "payment_pending",
  "rejected",
]);

export const MANUAL_RECOVERY_DUPLICATE_GUARD_WINDOW_MS = 24 * 60 * 60 * 1000;
export const MAX_MANUAL_RECOVERY_SEND_BATCH_SIZE = 40;

const DEFAULT_TEMPLATE_KEY: ManualRecoveryTemplateKey = "prizes_worldcup";

export function getDefaultManualRecoveryTemplateKey() {
  return DEFAULT_TEMPLATE_KEY;
}

export function isManualRecoveryTemplateKey(value: string): value is ManualRecoveryTemplateKey {
  return MANUAL_RECOVERY_TEMPLATE_OPTIONS.some((option) => option.key === value);
}

function buildActivationUrl() {
  const origin = resolvePublicSiteOrigin();
  return origin ? `${origin}/activar-pase` : getCanonicalProductionUrl("/activar-pase");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmailShell(params: {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  spotlightLines: string[];
  bodyLines: string[];
  paymentLines: string[];
  helpLine?: string;
  signatureLines?: string[];
  ctaLabel: string;
  ctaHref: string;
  footerLine: string;
  salutation: string;
}) {
  const spotlightHtml = params.spotlightLines
    .map((line, index) => {
      const color = index === 0 ? "#0047ab" : "#1d1d1b";
      return `<p style="margin:0 0 8px;font-size:${index === 0 ? "28px" : "22px"};line-height:1.15;font-weight:700;color:${color};font-family:Georgia,'Times New Roman',serif;">${escapeHtml(line)}</p>`;
    })
    .join("");
  const bodyHtml = params.bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#1d1d1b;">${escapeHtml(line)}</p>`,
    )
    .join("");
  const paymentHtml = params.paymentLines
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#514a40;">${escapeHtml(line)}</p>`,
    )
    .join("");
  const helpHtml = params.helpLine
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#514a40;">${escapeHtml(params.helpLine)}</p>`
    : "";
  const signatureHtml = (params.signatureLines ?? [])
    .map(
      (line, index) =>
        `<p style="margin:0 0 ${index === (params.signatureLines?.length ?? 0) - 1 ? "0" : "4px"};font-size:14px;line-height:1.6;color:#6a6258;">${escapeHtml(line)}</p>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#f6f1e7;color:#1d1d1b;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(params.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f1e7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffaf0;border:2px solid #e7ca55;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:20px 28px 0;">
                <p style="margin:0 0 12px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a6a10;">${escapeHtml(params.eyebrow)}</p>
                <h1 style="margin:0 0 16px;font-size:40px;line-height:1.02;color:#1d1d1b;font-family:Georgia,'Times New Roman',serif;">${escapeHtml(params.title)}</h1>
                <p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#514a40;">${escapeHtml(params.salutation)}</p>
                <p style="margin:0 0 22px;font-size:18px;line-height:1.6;color:#1d1d1b;">${escapeHtml(params.intro)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <div style="background:#fff4cb;border:1px solid #e7ca55;border-radius:20px;padding:20px 22px;">
                  ${spotlightHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 8px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 8px;">
                <a href="${escapeHtml(params.ctaHref)}" style="display:inline-block;border-radius:14px;background:#ffe16d;border:1px solid #e7ca55;padding:16px 24px;font-size:15px;line-height:1;font-weight:800;letter-spacing:0.02em;color:#1d1d1b;text-decoration:none;">${escapeHtml(params.ctaLabel)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 10px;">
                <div style="border-top:1px solid #eadfcb;padding-top:18px;">
                  ${paymentHtml}
                  ${helpHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#6a6258;">${escapeHtml(params.footerLine)}</p>
                ${signatureHtml ? `<div style="margin-top:12px;">${signatureHtml}</div>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export function buildManualRecoveryTemplateContent(
  templateKey: ManualRecoveryTemplateKey,
  recipient: ManualRecoveryRecipient,
) {
  const activationUrl = buildActivationUrl();
  const salutation = recipient.fullName?.trim()
    ? `Hola ${recipient.fullName.trim()},`
    : recipient.nickname?.trim()
      ? `Hola ${recipient.nickname.trim()},`
      : "Hola,";

  if (templateKey === "payment_issue") {
    return {
      subject: "Tu Pase Solidario sigue pendiente: retomá tu activación",
      activationUrl,
      html: renderEmailShell({
        preheader:
          "Si tu pago se frenó o quedó pendiente, podés retomarlo hoy y entrar al Prode antes del primer partido.",
        eyebrow: "Pase pendiente",
        title: "Todavía estás a tiempo de activarte",
        salutation,
        intro:
          "Vimos que tu activación no quedó confirmada. Si el checkout se frenó o te dio dudas, podés retomarlo hoy y entrar al Prode antes del primer partido.",
        spotlightLines: ["Pozo acumulado: $300.000", "+ camisetas para tu Team"],
        bodyLines: [
          "Con el Pase activo cargás pronósticos, seguís cada partido con puntaje y competís en el ranking.",
          "Además, tu aporte ayuda a financiar una tesis universitaria.",
        ],
        paymentLines: [
          "El pago se hace online. No necesitás saldo en Mercado Pago: podés elegir tarjeta u otros medios disponibles dentro del checkout.",
          "Si no podés pagar online, también podés consultar por transferencia. La activación por transferencia no es automática.",
        ],
        ctaLabel: "RETOMAR MI PASE",
        ctaHref: activationUrl,
        footerLine: "Si ya resolviste tu pago, podés ignorar este correo.",
      }),
      plainText: [
        salutation,
        "",
        "Vimos que tu activación no quedó confirmada. Si el checkout se frenó o te dio dudas, podés retomarlo hoy y entrar al Prode antes del primer partido.",
        "Pozo acumulado: $300.000",
        "+ camisetas para tu Team",
        "Con el Pase activo cargás pronósticos, seguís cada partido con puntaje y competís en el ranking.",
        "Además, tu aporte ayuda a financiar una tesis universitaria.",
        "",
        `Retomá tu Pase: ${activationUrl}`,
      ].join("\n"),
    };
  }

  if (templateKey === "solidarity") {
    return {
      subject: "Activá tu Pase y ayudá a financiar una tesis universitaria",
      activationUrl,
      html: renderEmailShell({
        preheader:
          "Entrá al Prode Mundial, competí por $300.000 y ayudá a financiar una tesis universitaria.",
        eyebrow: "Pase solidario",
        title: "Jugás el Mundial y ayudás de verdad",
        salutation,
        intro:
          "Activá tu Pase Solidario y entrá al Prode antes del primer partido. Competís con tu Team y, además, tu aporte ayuda a financiar una tesis universitaria.",
        spotlightLines: ["Pozo acumulado: $300.000", "+ camisetas para tu Team"],
        bodyLines: [
          "Con el Pase activo cargás pronósticos, seguís cada partido con puntaje y competís en el ranking.",
          "Es una entrada simple: jugás el Mundial y empujás una causa concreta al mismo tiempo.",
        ],
        paymentLines: [
          "El pago se hace online. No necesitás saldo en Mercado Pago: podés elegir tarjeta u otros medios disponibles dentro del checkout.",
          "Si no podés pagar online, también podés consultar por transferencia. La activación por transferencia no es automática.",
        ],
        ctaLabel: "ACTIVAR MI PASE HOY",
        ctaHref: activationUrl,
        footerLine: "Si ya activaste tu Pase, este recordatorio no requiere acción.",
      }),
      plainText: [
        salutation,
        "",
        "Activá tu Pase Solidario y entrá al Prode antes del primer partido. Competís con tu Team y, además, tu aporte ayuda a financiar una tesis universitaria.",
        "Pozo acumulado: $300.000",
        "+ camisetas para tu Team",
        "Con el Pase activo cargás pronósticos, seguís cada partido con puntaje y competís en el ranking.",
        "",
        `Activá tu Pase: ${activationUrl}`,
      ].join("\n"),
    };
  }

  return {
    subject: "Tu Pase Solidario sigue pendiente",
    activationUrl,
    html: renderEmailShell({
      preheader:
        "Recibís este mensaje porque te registraste en SoliProde y tu Pase todavía no figura activo.",
      eyebrow: "Pase pendiente",
      title: "Tu Pase Solidario sigue pendiente",
      salutation,
      intro: "Recibís este mensaje porque te registraste en SoliProde y tu Pase todavía no figura activo.",
      spotlightLines: ["Activá tu Pase Solidario", "Completá tu activación para entrar al Prode."],
      bodyLines: [
        "Con el Pase activo podés cargar pronósticos, seguir el Mundial con puntaje, competir en el ranking y participar por los premios del juego. El pozo acumulado ya es de $300.000 y también hay camisetas para el Team ganador.",
        "Además, tu aporte ayuda a financiar una tesis universitaria.",
      ],
      paymentLines: [
        "El pago se hace online. No necesitás saldo en Mercado Pago: podés elegir tarjeta u otros medios disponibles dentro del checkout.",
        "Si no podés pagar online, también podés consultar por transferencia. La activación por transferencia no es automática.",
      ],
      helpLine: "Si necesitás ayuda, respondé este correo.",
      signatureLines: ["SoliProde", "hola@soliprode.com", "https://www.soliprode.com"],
      ctaLabel: "Activar mi Pase",
      ctaHref: activationUrl,
      footerLine: "Cuando confirmás tu Pase, quedás listo para competir en SoliProde.",
    }),
    plainText: [
      salutation,
      "",
      "Recibís este mensaje porque te registraste en SoliProde y tu Pase todavía no figura activo.",
      "Activá tu Pase Solidario para completar tu ingreso al Prode.",
      "Con el Pase activo podés cargar pronósticos, seguir el Mundial con puntaje, competir en el ranking y participar por los premios del juego. El pozo acumulado ya es de $300.000 y también hay camisetas para el Team ganador.",
      "Además, tu aporte ayuda a financiar una tesis universitaria.",
      "",
      "El pago se hace online. No necesitás saldo en Mercado Pago: podés elegir tarjeta u otros medios disponibles dentro del checkout.",
      "Si no podés pagar online, también podés consultar por transferencia. La activación por transferencia no es automática.",
      "",
      "Si necesitás ayuda, respondé este correo.",
      "",
      "SoliProde",
      "hola@soliprode.com",
      "https://www.soliprode.com",
      "",
      `Activá tu Pase: ${activationUrl}`,
    ].join("\n"),
  };
}
