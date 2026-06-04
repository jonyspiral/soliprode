"use client";

import { useState, type ReactNode } from "react";

async function requestCheckoutUrl() {
  const response = await fetch("/api/payments/mercadopago/create-preference", {
    method: "POST",
  });
  const payload = (await response.json()) as {
    ok: boolean;
    checkoutUrl?: string;
  };

  if (!response.ok || !payload.ok || !payload.checkoutUrl) {
    throw new Error("checkout_unavailable");
  }

  window.location.assign(payload.checkoutUrl);
}

type StartCheckoutButtonProps = {
  children: ReactNode;
  className?: string;
};

export function StartCheckoutButton({ children, className = "" }: StartCheckoutButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      await requestCheckoutUrl();
    } catch {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={() => void handleClick()} className={className} disabled={pending}>
      {children}
    </button>
  );
}

type StartCheckoutCardProps = {
  children: ReactNode;
  className?: string;
};

export function StartCheckoutCard({ children, className = "" }: StartCheckoutCardProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) {
      return;
    }

    setPending(true);

    try {
      await requestCheckoutUrl();
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
