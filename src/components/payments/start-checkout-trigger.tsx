"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type CheckoutResponsePayload = {
  ok: boolean;
  alreadyPaid?: boolean;
  checkoutUrl?: string;
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
    throw new Error("checkout_unavailable");
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
  onBeforeStart?: () => Promise<boolean> | boolean;
};

export function StartCheckoutButton({
  children,
  className = "",
  disabled = false,
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
    } catch {
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
};

export function StartCheckoutCard({ children, className = "" }: StartCheckoutCardProps) {
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
    } catch {
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
