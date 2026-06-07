import { normalizePromoterCode } from "@/lib/auth/promoter-attribution";
import { normalizeInviteCode } from "@/lib/groups/competition";

type SearchValueSource =
  | URLSearchParams
  | {
      get(name: string): string | null | undefined;
    };

export function readGroupInviteCodeFromSearchParams(params: SearchValueSource) {
  return normalizeInviteCode(
    params.get("group") ?? params.get("groupCode") ?? params.get("code") ?? "",
  );
}

export function buildInternalPathWithSearch(
  pathname: string,
  searchParams?: URLSearchParams | null,
) {
  const queryString = searchParams?.toString() ?? "";
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function buildEnterHref(params: { promoterCode?: string | null; groupInviteCode?: string | null }) {
  const searchParams = new URLSearchParams();
  const promoterCode = normalizePromoterCode(params.promoterCode);
  const groupInviteCode = normalizeInviteCode(params.groupInviteCode ?? "");

  if (promoterCode) {
    searchParams.set("p", promoterCode);
  }

  if (groupInviteCode) {
    searchParams.set("group", groupInviteCode);
  }

  return buildInternalPathWithSearch("/entrar", searchParams);
}
