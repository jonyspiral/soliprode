"use client";

import { useEffect, useState } from "react";
import { entryConfig, formatEntryCountdown } from "@/lib/product/entry-config";

type EntryCountdownProps = {
  label?: string;
  className?: string;
};

export function EntryCountdown({
  label = "Precio inicial termina en",
  className = "",
}: EntryCountdownProps) {
  const [remaining, setRemaining] = useState(() => formatEntryCountdown(entryConfig.priceValidUntil));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemaining(formatEntryCountdown(entryConfig.priceValidUntil));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      className={[
        "rounded-lg border border-[var(--color-line)] bg-white/80 px-3 py-3",
        className,
      ].join(" ")}
    >
      <p className="text-sm font-semibold text-[var(--color-ink)]">
        {label} {remaining}
      </p>
    </div>
  );
}
