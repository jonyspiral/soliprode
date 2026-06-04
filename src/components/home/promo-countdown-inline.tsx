"use client";

import { useEffect, useState } from "react";
import { formatPromoCountdown, PROMO_END_AT } from "@/lib/product/promo-campaign";

type PromoCountdownInlineProps = {
  className?: string;
};

export function PromoCountdownInline({ className = "" }: PromoCountdownInlineProps) {
  const [remaining, setRemaining] = useState(() => formatPromoCountdown(PROMO_END_AT));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemaining(formatPromoCountdown(PROMO_END_AT));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return <span className={className}>{remaining ?? "0h 00m 00s"}</span>;
}
