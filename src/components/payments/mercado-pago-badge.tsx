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
        "flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white px-3 py-3",
        compact ? "text-sm" : "text-base",
        className,
      ].join(" ")}
    >
      <Image
        src="/brand/mercado-pago.svg"
        alt="Mercado Pago"
        width={compact ? 22 : 28}
        height={compact ? 22 : 28}
        className="h-auto w-auto shrink-0"
      />
      <div className="min-w-0">
        <p className="font-semibold text-[var(--color-ink)]">Pagás con Mercado Pago</p>
        {secondaryText ? (
          <p className="text-xs leading-5 text-[var(--color-muted)]">{secondaryText}</p>
        ) : null}
      </div>
    </div>
  );
}
