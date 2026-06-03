"use client";

import { useEffect, useState } from "react";
import { formatPromoCountdown, PROMO_END_AT } from "@/lib/product/promo-campaign";

type PromoCountdownProps = {
  className?: string;
  variant?: "hero" | "surface";
};

export function PromoCountdown({ className = "", variant = "hero" }: PromoCountdownProps) {
  const [remaining, setRemaining] = useState(() => formatPromoCountdown(PROMO_END_AT));
  const isSurface = variant === "surface";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemaining(formatPromoCountdown(PROMO_END_AT));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      className={[
        isSurface
          ? "rounded-[1rem] border border-[#e7ca55] bg-[linear-gradient(180deg,rgba(255,225,109,0.42)_0%,rgba(255,255,255,0.82)_100%)] px-4 py-4 shadow-[0_10px_22px_rgba(0,50,125,0.08)]"
          : "rounded-[1rem] border border-[#e7ca55]/55 bg-[linear-gradient(180deg,rgba(255,225,109,0.24)_0%,rgba(255,255,255,0.08)_100%)] px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.14)]",
        className,
      ].join(" ")}
    >
      <p
        className={[
          "text-[11px] font-semibold uppercase tracking-[0.12em]",
          isSurface ? "text-[var(--color-primary)]" : "text-[#ffe793]",
        ].join(" ")}
      >
        Precio promocional
      </p>
      <p
        className={[
          "mt-2 font-serif text-[1.95rem] font-bold uppercase leading-none sm:text-[2.35rem]",
          isSurface ? "text-[var(--color-ink)]" : "text-white",
        ].join(" ")}
      >
        {remaining ?? "Precio promocional finalizado"}
      </p>
      <p
        className={[
          "mt-2 text-xs leading-5 sm:text-sm",
          isSurface ? "text-[var(--color-muted)]" : "text-[#dfe6ff]",
        ].join(" ")}
      >
        Completá tu inscripción para jugar.
      </p>
    </div>
  );
}
