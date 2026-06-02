import { normalizePromoterCode } from "@/lib/auth/promoter-attribution";

export async function ensureBrowserUserRecords() {
  try {
    const promoterInput = document.querySelector<HTMLInputElement>("input[name='promoter_code']");
    const promoterCode = normalizePromoterCode(promoterInput?.value ?? null);

    const response = await fetch("/api/auth/finish-signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promoterCode,
      }),
    });

    const payload = (await response.json()) as {
      ok: boolean;
      error?: string;
    };

    if (!response.ok || !payload.ok) {
      return {
        ok: false as const,
        error:
          payload.error ??
          "La sesión se abrió, pero no pudimos preparar tu cuenta todavía. Intentá nuevamente en unos minutos.",
      };
    }

    return {
      ok: true as const,
    };
  } catch {
    return {
      ok: false as const,
      error:
        "La sesión se abrió, pero no pudimos preparar tu cuenta todavía. Intentá nuevamente en unos minutos.",
    };
  }
}
