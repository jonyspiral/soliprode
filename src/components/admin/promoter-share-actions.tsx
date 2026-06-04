"use client";

import { useState } from "react";

type PromoterShareActionsProps = {
  email: string | null;
  mailtoHref: string | null;
  message: string;
  whatsappHref: string | null;
};

export function PromoterShareActions({
  email,
  mailtoHref,
  message,
  whatsappHref,
}: PromoterShareActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
      >
        {copied ? "Copiado" : "Copiar mensaje"}
      </button>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          WhatsApp
        </a>
      ) : null}
      {mailtoHref && email ? (
        <a
          href={mailtoHref}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)]"
        >
          Email
        </a>
      ) : null}
    </div>
  );
}
