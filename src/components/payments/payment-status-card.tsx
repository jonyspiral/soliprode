import Link from "next/link";
import { MercadoPagoBadge } from "@/components/payments/mercado-pago-badge";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";

type PaymentStatusCardProps = {
  title: string;
  description: string;
  notice: string;
  tone?: "info" | "error";
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PaymentStatusCard({
  title,
  description,
  notice,
  tone = "info",
  primaryHref = "/dashboard",
  primaryLabel = "Volver al panel",
  secondaryHref = "/matches",
  secondaryLabel = "Ir a Partidos",
}: PaymentStatusCardProps) {
  return (
    <PageStack>
      <SurfaceCard title={title} description={description} tone="accent">
        <div className="grid gap-4">
          <MercadoPagoBadge secondaryText="Mercado Pago sigue siendo el flujo principal" />
          <InfoNotice message={notice} tone={tone} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-ink)]"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
            >
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </SurfaceCard>
    </PageStack>
  );
}
