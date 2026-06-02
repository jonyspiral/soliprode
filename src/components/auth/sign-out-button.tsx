"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

export function SignOutButton({
  className,
  label = "Cerrar sesión",
}: SignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Keep sign-out resilient even if the remote request fails.
    }

    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={() => void handleSignOut()} className={className}>
      {label}
    </button>
  );
}
