"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

async function withLogoutTimeout<T>(promise: Promise<T>, timeoutMs = 3000) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export function SignOutButton({
  className,
  label = "Cerrar sesión",
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);

    try {
      const supabase = createBrowserSupabaseClient();
      await withLogoutTimeout(supabase.auth.signOut({ scope: "local" }));
      await withLogoutTimeout(
        fetch("/api/auth/sign-out", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        }),
      );

      if (typeof window !== "undefined") {
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith("sb-")) {
            window.localStorage.removeItem(key);
          }
        }
      }
    } catch {
      // Keep sign-out resilient even if the remote request fails.
    } finally {
      if (typeof window !== "undefined") {
        window.location.assign("/");
        return;
      }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={pending}
      className={className}
    >
      {pending ? "Saliendo..." : label}
    </button>
  );
}
