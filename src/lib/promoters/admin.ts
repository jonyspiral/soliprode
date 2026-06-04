import { entryConfig } from "@/lib/product/entry-config";
import { CURRENT_PRIZE_POOL_LABEL } from "@/lib/product/home-display";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type PromoterRow = {
  id: string;
  name: string;
  code: string;
  email: string | null;
  whatsapp: string | null;
  profile_id: string | null;
  status: "active" | "inactive";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileLinkRow = {
  id: string;
  email: string | null;
};

type ParticipationRow = {
  id: string;
  profile_id: string;
  promoter_id: string | null;
  payment_status: string;
  entry_price: number | string | null;
  created_at: string;
};

export type PromoterFormInput = {
  id?: string | null;
  name: string;
  code: string | null;
  email: string | null;
  whatsapp: string | null;
  status: "active" | "inactive";
  notes: string | null;
};

export type PromoterSummary = PromoterRow & {
  rankingPosition: number;
  registeredPlayersCount: number;
  activePlayersCount: number;
  confirmedContributionsCount: number;
  totalRaised: number;
  linkedProfileEmail: string | null;
};

export type PromoterRankingEntry = Pick<
  PromoterSummary,
  | "id"
  | "name"
  | "code"
  | "status"
  | "rankingPosition"
  | "activePlayersCount"
  | "confirmedContributionsCount"
  | "totalRaised"
>;

export type PromotersAdminSnapshot = {
  promoters: PromoterSummary[];
  ranking: PromoterRankingEntry[];
  totals: {
    promoterCount: number;
    activePromoterCount: number;
    totalRaised: number;
    activePlayersCount: number;
  };
};

export type PromoterSelfSnapshot = {
  promoter: PromoterSummary;
  ranking: PromoterRankingEntry[];
};

function slugifyPromoterCode(rawValue: string) {
  return rawValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 24);
}

function resolveParticipationAmount(value: number | string | null) {
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

export function normalizePromoterStatus(rawValue: string | null | undefined): "active" | "inactive" {
  return rawValue === "inactive" ? "inactive" : "active";
}

export function normalizePromoterCodeInput(rawValue: string | null | undefined) {
  if (!rawValue) {
    return null;
  }

  const normalized = slugifyPromoterCode(rawValue);
  return normalized || null;
}

export function buildPromoterCodeFromName(name: string) {
  const normalized = slugifyPromoterCode(name);
  return normalized || "PROMOTER";
}

export function normalizePromoterWhatsapp(rawValue: string | null | undefined) {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();
  return trimmed || null;
}

export function normalizeWhatsappForLink(rawValue: string | null | undefined) {
  if (!rawValue) {
    return null;
  }

  const digits = rawValue.replace(/\D+/g, "");
  return digits || null;
}

export function buildPromoterShareLink(baseUrl: string, promoterCode: string) {
  const url = new URL(baseUrl);
  url.searchParams.set("p", promoterCode);
  return url.toString();
}

export function buildPromoterShareMessage(baseUrl: string, promoterCode: string) {
  return buildPromoterShareMessageWithPrizePool(baseUrl, promoterCode, CURRENT_PRIZE_POOL_LABEL);
}

export function buildPromoterShareMessageWithPrizePool(
  baseUrl: string,
  promoterCode: string,
  prizePoolLabel: string,
) {
  const link = buildPromoterShareLink(baseUrl, promoterCode);

  return [
    "Te invito a participar del Prode Mundial, un prode solidario para financiar nuestra tesis universitaria.",
    "",
    "Competís por el pozo como Jugador y también podés armar un Team con tus mejores amigos para ir por la gloria como equipo.",
    "",
    `El pozo acumulado ya es de ${prizePoolLabel} y sigue creciendo.`,
    "",
    "Participá, ganá y ayudá.",
    "Llevá a tu grupo al campeonato.",
    "",
    "Sumate desde acá:",
    link,
  ].join("\n");
}

export async function resolveUniquePromoterCode(input: { name: string; code?: string | null; excludeId?: string | null }) {
  const service = createServiceRoleSupabaseClient();
  const preferredCode = normalizePromoterCodeInput(input.code) ?? buildPromoterCodeFromName(input.name);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = attempt === 0 ? "" : String(attempt + 1);
    const candidate = `${preferredCode}${suffix}`.slice(0, 24);
    const { data } = await service.from("promoters").select("id").eq("code", candidate).maybeSingle();

    if (!data || data.id === input.excludeId) {
      return candidate;
    }
  }

  throw new Error("promoter_code_generation_failed");
}

export async function getPromotersAdminSnapshot(): Promise<PromotersAdminSnapshot> {
  const service = createServiceRoleSupabaseClient();
  const [promotersResult, participationsResult] = await Promise.all([
    service
      .from("promoters")
      .select("id, name, code, email, whatsapp, profile_id, status, notes, created_at, updated_at")
      .order("name", { ascending: true }),
    service
      .from("participations")
      .select("id, profile_id, promoter_id, payment_status, entry_price, created_at")
      .not("promoter_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  const promoters = (promotersResult.data ?? []) as PromoterRow[];
  const attributedParticipations = (participationsResult.data ?? []) as ParticipationRow[];
  const linkedProfileIds = promoters.map((promoter) => promoter.profile_id).filter(Boolean) as string[];
  const linkedProfilesMap = new Map<string, ProfileLinkRow>();

  if (linkedProfileIds.length > 0) {
    const { data: linkedProfiles } = await service
      .from("profiles")
      .select("id, email")
      .in("id", linkedProfileIds);

    for (const profile of (linkedProfiles ?? []) as ProfileLinkRow[]) {
      linkedProfilesMap.set(profile.id, profile);
    }
  }

  const participationsByProfile = new Map<string, ParticipationRow[]>();

  for (const participation of attributedParticipations) {
    const existing = participationsByProfile.get(participation.profile_id) ?? [];
    existing.push(participation);
    participationsByProfile.set(participation.profile_id, existing);
  }

  const primaryParticipations = Array.from(participationsByProfile.values())
    .map((rows) => pickPrimaryParticipation(rows).participation)
    .filter((row): row is ParticipationRow => Boolean(row && row.promoter_id));

  const statsByPromoter = new Map<
    string,
    {
      registeredPlayersCount: number;
      activePlayersCount: number;
      confirmedContributionsCount: number;
      totalRaised: number;
    }
  >();

  for (const participation of primaryParticipations) {
    const promoterId = participation.promoter_id;

    if (!promoterId) {
      continue;
    }

    const current = statsByPromoter.get(promoterId) ?? {
      registeredPlayersCount: 0,
      activePlayersCount: 0,
      confirmedContributionsCount: 0,
      totalRaised: 0,
    };

    current.registeredPlayersCount += 1;

    if (participation.payment_status === "paid") {
      current.activePlayersCount += 1;
      current.confirmedContributionsCount += 1;
      current.totalRaised += resolveParticipationAmount(participation.entry_price) ?? entryConfig.initialPrice;
    }

    statsByPromoter.set(promoterId, current);
  }

  const promoterSummaries = promoters
    .map((promoter) => {
      const stats = statsByPromoter.get(promoter.id) ?? {
        registeredPlayersCount: 0,
        activePlayersCount: 0,
        confirmedContributionsCount: 0,
        totalRaised: 0,
      };

      return {
        ...promoter,
        rankingPosition: 0,
        registeredPlayersCount: stats.registeredPlayersCount,
        activePlayersCount: stats.activePlayersCount,
        confirmedContributionsCount: stats.confirmedContributionsCount,
        totalRaised: stats.totalRaised,
        linkedProfileEmail: promoter.profile_id
          ? linkedProfilesMap.get(promoter.profile_id)?.email ?? null
          : null,
      };
    })
    .sort((a, b) => {
      if (b.totalRaised !== a.totalRaised) {
        return b.totalRaised - a.totalRaised;
      }

      if (b.activePlayersCount !== a.activePlayersCount) {
        return b.activePlayersCount - a.activePlayersCount;
      }

      return a.name.localeCompare(b.name, "es");
    })
    .map((promoter, index) => ({
      ...promoter,
      rankingPosition: index + 1,
    }));

  return {
    promoters: promoterSummaries,
    ranking: promoterSummaries.map((promoter) => ({
      id: promoter.id,
      name: promoter.name,
      code: promoter.code,
      status: promoter.status,
      rankingPosition: promoter.rankingPosition,
      activePlayersCount: promoter.activePlayersCount,
      confirmedContributionsCount: promoter.confirmedContributionsCount,
      totalRaised: promoter.totalRaised,
    })),
    totals: {
      promoterCount: promoterSummaries.length,
      activePromoterCount: promoterSummaries.filter((promoter) => promoter.status === "active").length,
      totalRaised: promoterSummaries.reduce((sum, promoter) => sum + promoter.totalRaised, 0),
      activePlayersCount: promoterSummaries.reduce((sum, promoter) => sum + promoter.activePlayersCount, 0),
    },
  };
}

export async function getPromoterSelfSnapshot(profileId: string): Promise<PromoterSelfSnapshot | null> {
  const snapshot = await getPromotersAdminSnapshot();
  const promoter = snapshot.promoters.find((entry) => entry.profile_id === profileId) ?? null;

  if (!promoter) {
    return null;
  }

  return {
    promoter,
    ranking: snapshot.ranking,
  };
}
