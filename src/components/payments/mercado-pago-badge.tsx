import Image from "next/image";

type MercadoPagoBadgeProps = {
  secondaryText?: string;
  className?: string;
  compact?: boolean;
};

export function MercadoPagoBadge({
  secondaryText = "Pago online seguro",
  className = "",
  compact = false,
}: MercadoPagoBadgeProps) {
  return (
    <div
      className={[
        "inline-flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--color-line)] bg-white px-3 py-2 text-left shadow-[0_3px_10px_rgba(0,50,125,0.06)]",
        compact ? "text-xs" : "text-sm",
        className,
      ].join(" ")}
    >
      <div className="flex h-8 max-h-8 w-[88px] max-w-[88px] shrink-0 items-center justify-center overflow-hidden">
        <Image
          src="/brand/mercado-pago.svg"
          alt="Mercado Pago"
          width={88}
          height={20}
          className="h-auto max-h-5 w-auto max-w-[88px] object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-[var(--color-ink)]">Mercado Pago</p>
        {secondaryText ? (
          <p className="truncate text-[11px] leading-4 text-[var(--color-muted)]">{secondaryText}</p>
        ) : null}
      </div>
    </div>
  );
}
