"use client";

import { useEffect, useState } from "react";
import { formatEntryCountdown } from "@/lib/product/entry-config";

type CompleteRegistrationButtonProps = {
  className?: string;
  compact?: boolean;
};

export function CompleteRegistrationButton({
  className = "",
  compact = false,
}: CompleteRegistrationButtonProps) {
  const [countdown, setCountdown] = useState(() => formatEntryCountdown());
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdown(formatEntryCountdown());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function startCheckout() {
    setStartingCheckout(true);
    setNotice(null);

    try {
      const response = await fetch("/api/payments/mercadopago/create-preference", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        checkoutUrl?: string;
      };

      if (!response.ok || !payload.ok || !payload.checkoutUrl) {
        setNotice("No pudimos abrir la inscripción ahora. Probá de nuevo.");
        return;
      }

      window.location.assign(payload.checkoutUrl);
    } catch {
      setNotice("No pudimos abrir la inscripción ahora. Probá de nuevo.");
    } finally {
      setStartingCheckout(false);
    }
  }

  return (
    <div className={["grid gap-1.5", className].join(" ")}>
      <button
        type="button"
        onClick={() => void startCheckout()}
        disabled={startingCheckout}
        className={[
          "inline-flex items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-70",
          compact
            ? "min-h-10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em]"
            : "min-h-11 px-4 py-3 text-sm font-bold uppercase tracking-[0.08em]",
        ].join(" ")}
      >
        {startingCheckout ? "Abriendo..." : "Completar inscripción"}
      </button>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5 text-[var(--color-muted)]">
        <span>{`Precio promocional · ${countdown}`}</span>
        <span>con Mercado Pago</span>
      </div>
      {notice ? <p className="text-[11px] leading-5 text-[#93000a]">{notice}</p> : null}
    </div>
  );
}
