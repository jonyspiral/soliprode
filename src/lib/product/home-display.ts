import { entryConfig, formatEntryPrice } from "@/lib/product/entry-config";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getOptionalEnv } from "@/lib/env";

export const INITIAL_PRIZE_POOL_ARS = 300000;
export const INITIAL_PLAYERS_COUNT = 60;
export const CURRENT_PRIZE_POOL_LABEL = formatEntryPrice(INITIAL_PRIZE_POOL_ARS);

type PaidParticipationRow = {
  profile_id: string;
  entry_price: number | string | null;
};

export type HomeDisplayMetrics = {
  prizePoolArs: number;
  prizePoolLabel: string;
  playersCount: number;
  playersLabel: string;
};

function formatPlayersCount(count: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(count);
}

function resolveNumericAmount(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

async function readRealHomeMetrics() {
  if (!getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")) {
    return null;
  }

  try {
    const service = createServiceRoleSupabaseClient();
    const [{ count: profilesCount, error: profilesError }, { data: paidParticipations, error: paidError }] =
      await Promise.all([
        service.from("profiles").select("id", { count: "exact", head: true }),
        service.from("participations").select("profile_id, entry_price").eq("payment_status", "paid"),
      ]);

    if (profilesError || paidError) {
      return null;
    }

    const prizePoolArs = ((paidParticipations ?? []) as PaidParticipationRow[]).reduce((total, row) => {
      const amount = resolveNumericAmount(row.entry_price);
      return total + (amount ?? entryConfig.initialPrice);
    }, 0);

    return {
      prizePoolArs,
      playersCount: profilesCount ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getHomeDisplayMetrics(): Promise<HomeDisplayMetrics> {
  const realMetrics = await readRealHomeMetrics();
  const prizePoolArs = Math.max(realMetrics?.prizePoolArs ?? 0, INITIAL_PRIZE_POOL_ARS);
  const playersCount = Math.max(realMetrics?.playersCount ?? 0, INITIAL_PLAYERS_COUNT);

  return {
    prizePoolArs,
    prizePoolLabel: formatEntryPrice(prizePoolArs),
    playersCount,
    playersLabel: formatPlayersCount(playersCount),
  };
}
