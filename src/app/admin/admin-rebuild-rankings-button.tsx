"use client";

import { useTransition } from "react";
import { rebuildRankingsAction } from "@/app/admin/actions";

export function AdminRebuildRankingsButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        startTransition(async () => {
          await rebuildRankingsAction();
        });
      }}
      disabled={isPending}
      className="relative z-10 inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Recalculando..." : "Recalcular ranking"}
    </button>
  );
}
