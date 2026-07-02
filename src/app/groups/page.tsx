import { redirect } from "next/navigation";
import { SOLIPRODE_BRAND_ASSETS } from "@/lib/brand-assets";
import type { Metadata } from "next";
import { TeamsScreen } from "@/app/teams/_components/teams-screen";
import { getTeamsPageState } from "@/app/teams/_page-state";
import { buildInternalPathWithSearch, buildEnterHref } from "@/lib/invite-flow";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Groups",
  description:
    "SoliProde Teams dentro de la app. Armá tu Team, mirá tu 11 titular, el Banco y el ranking competitivo.",
  openGraph: {
    title: "Groups | SoliProde",
    description:
      "Prode Mundial Solidario 2026. Competí por el pozo, armá tu Team y ayudá a financiar una tesis universitaria.",
    images: [
      {
        url: `https://www.soliprode.com${SOLIPRODE_BRAND_ASSETS.shareOg1200x630}`,
        width: 1200,
        height: 630,
        alt: "SoliProde",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Groups | SoliProde",
    description:
      "Prode Mundial Solidario 2026. Competí por el pozo, armá tu Team y ayudá a financiar una tesis universitaria.",
    images: [`https://www.soliprode.com${SOLIPRODE_BRAND_ASSETS.shareOg1200x630}`],
  },
};

type GroupsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> | undefined>;
};

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const resolvedSearchParams = (searchParams ? await searchParams : undefined) ?? undefined;
  const inviteCode =
    typeof resolvedSearchParams?.code === "string"
      ? resolvedSearchParams.code
      : Array.isArray(resolvedSearchParams?.code)
        ? resolvedSearchParams?.code[0] ?? ""
        : "";
  const teamPassCode =
    typeof resolvedSearchParams?.slot === "string"
      ? resolvedSearchParams.slot
      : Array.isArray(resolvedSearchParams?.slot)
        ? resolvedSearchParams?.slot[0] ?? ""
        : "";

  if (inviteCode || teamPassCode) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const currentPath = buildInternalPathWithSearch(
      "/groups",
      new URLSearchParams(
        Object.entries(resolvedSearchParams ?? {}).flatMap(([key, value]) =>
          Array.isArray(value)
            ? value.map((entry) => [key, entry])
            : typeof value === "string"
              ? [[key, value]]
              : [],
        ),
      ),
    );

    if (!user) {
      redirect(`/login?next=${encodeURIComponent(currentPath)}`);
    }
  }

  const state = await getTeamsPageState(searchParams);

  if (
    state.inviteContext?.code &&
    !state.teamPassInviteContext?.code &&
    state.authStatus === "member" &&
    (state.currentParticipationStatus !== "paid" || !state.currentAlias)
  ) {
    redirect(buildEnterHref({ groupInviteCode: state.inviteContext.code }));
  }

  return <TeamsScreen {...state} routeBase="/groups" data={state.screenData} />;
}
