import { getOptionalEnv } from "@/lib/env";
import { entryConfig } from "@/lib/product/entry-config";

export type BankTransferConfig = {
  alias: string;
  cvu: string;
  holder: string;
  suggestedConcept: string;
  amountLabel: string;
};

function readPublicValue(name: string) {
  return getOptionalEnv(name)?.trim() ?? null;
}

export function getBankTransferConfig(): BankTransferConfig | null {
  const alias = readPublicValue("NEXT_PUBLIC_BANK_TRANSFER_ALIAS");
  const cvu = readPublicValue("NEXT_PUBLIC_BANK_TRANSFER_CVU");
  const holder = readPublicValue("NEXT_PUBLIC_BANK_TRANSFER_HOLDER");

  if (!alias || !cvu || !holder) {
    return null;
  }

  return {
    alias,
    cvu,
    holder,
    suggestedConcept:
      readPublicValue("NEXT_PUBLIC_BANK_TRANSFER_CONCEPT") ?? "Pase Solidario SoliProde",
    amountLabel: new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: entryConfig.currency,
      maximumFractionDigits: 0,
    }).format(entryConfig.initialPrice),
  };
}

export function buildSuggestedTransferReference(participationId: string | null) {
  if (!participationId) {
    return "PASE-SOLIPRODE";
  }

  return `PASE-${participationId.slice(0, 8).toUpperCase()}`;
}

