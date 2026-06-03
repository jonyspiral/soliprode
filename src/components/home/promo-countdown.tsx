"use client";

import { useEffect, useState } from "react";
import { formatPromoCountdown, PROMO_END_AT } from "@/lib/product/promo-campaign";

type PromoCountdownProps = {
  className?: string;
};

export function PromoCountdown({ className = "" }: PromoCountdownProps) {
  const [remaining, setRemaining] = useState(() => formatPromoCountdown(PROMO_END_AT));

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
        "rounded-[1rem] border border-[#e7ca55]/55 bg-[linear-gradient(180deg,rgba(255,225,109,0.24)_0%,rgba(255,255,255,0.08)_100%)] px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.14)]",
        className,
      ].join(" ")}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#ffe793]">
        Precio promocional
      </p>
      <p className="mt-2 font-serif text-[1.95rem] font-bold uppercase leading-none text-white sm:text-[2.35rem]">
        {remaining ?? "Precio promocional finalizado"}
      </p>
      <p className="mt-2 text-xs leading-5 text-[#dfe6ff] sm:text-sm">
        Completá tu inscripción para jugar.
      </p>
    </div>
  );
}
