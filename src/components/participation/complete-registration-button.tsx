"use client";

import { useEffect, useState } from "react";
import { StartCheckoutButton } from "@/components/payments/start-checkout-trigger";
import { formatEntryCountdown } from "@/lib/product/entry-config";

type CompleteRegistrationButtonProps = {
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  onError?: (message: string) => void;
  helperText?: string | null;
  onBeforeStart?: () => Promise<boolean> | boolean;
};

export function CompleteRegistrationButton({
  className = "",
  compact = false,
  disabled = false,
  onError,
  helperText = null,
  onBeforeStart,
}: CompleteRegistrationButtonProps) {
  const [countdown, setCountdown] = useState(() => formatEntryCountdown());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCountdown(formatEntryCountdown());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className={["grid gap-1.5", className].join(" ")}>
      <StartCheckoutButton
        disabled={disabled}
        onError={onError}
        onBeforeStart={onBeforeStart}
        className={[
          "inline-flex items-center justify-center rounded-xl border border-[#e7ca55] bg-[#ffe16d] text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-70",
          compact
            ? "min-h-10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em]"
            : "min-h-11 px-4 py-3 text-sm font-bold uppercase tracking-[0.08em]",
        ].join(" ")}
      >
        Pagar y activar mi Pase
      </StartCheckoutButton>
      {helperText ? <p className="text-[11px] leading-5 text-[var(--color-muted)]">{helperText}</p> : null}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5 text-[var(--color-muted)]">
        <span>{`Precio promocional · ${countdown}`}</span>
        <span>No necesitás cuenta de Mercado Pago</span>
      </div>
    </div>
  );
}
