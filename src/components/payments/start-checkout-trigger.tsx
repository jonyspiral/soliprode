"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type CheckoutResponsePayload = {
  ok: boolean;
  alreadyPaid?: boolean;
  error?: string;
  checkoutUrl?: string;
  initPoint?: string | null;
  sandboxInitPoint?: string | null;
  redirectTo?: string;
};

export async function requestCheckoutUrl() {
  const response = await fetch("/api/payments/mercadopago/create-preference", {
    method: "POST",
  });
  const payload = (await response.json()) as CheckoutResponsePayload;

  if (response.status === 409 && payload.alreadyPaid) {
    return {
      kind: "already_paid" as const,
      redirectTo: payload.redirectTo ?? "/dashboard",
    };
  }

  if (!response.ok || !payload.ok || !payload.checkoutUrl) {
    throw new Error(payload.error ?? "No pudimos abrir el checkout ahora. Probá de nuevo.");
  }

  return {
    kind: "checkout" as const,
    checkoutUrl: payload.checkoutUrl,
  };
}

type StartCheckoutButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
  onBeforeStart?: () => Promise<boolean> | boolean;
};

export function StartCheckoutButton({
  children,
  className = "",
  disabled = false,
  onError,
  onBeforeStart,
}: StartCheckoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending || disabled) {
      return;
    }

    setPending(true);

    try {
      if (onBeforeStart) {
        const canContinue = await onBeforeStart();

        if (!canContinue) {
          setPending(false);
          return;
        }
      }

      const result = await requestCheckoutUrl();

      if (result.kind === "already_paid") {
        router.push(result.redirectTo);
        return;
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      onError?.(
        error instanceof Error && error.message
          ? error.message
          : "No pudimos abrir el checkout ahora. Probá de nuevo.",
      );
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={className}
      disabled={pending || disabled}
    >
      {children}
    </button>
  );
}

type StartCheckoutCardProps = {
  children: ReactNode;
  className?: string;
  onError?: (message: string) => void;
};

export function StartCheckoutCard({ children, className = "", onError }: StartCheckoutCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      const result = await requestCheckoutUrl();

      if (result.kind === "already_paid") {
        router.push(result.redirectTo);
        return;
      }

      window.location.assign(result.checkoutUrl);
    } catch (error) {
      onError?.(
        error instanceof Error && error.message
          ? error.message
          : "No pudimos abrir el checkout ahora. Probá de nuevo.",
      );
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={className}
      disabled={pending}
    >
      {children}
    </button>
  );
}
