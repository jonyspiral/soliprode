import { SOLIPRODE_BRAND_ASSETS } from "@/lib/brand-assets";
import type { Metadata } from "next";
import { TeamsScreen } from "@/app/teams/_components/teams-screen";
import { getTeamsPageState } from "@/app/teams/_page-state";

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
  const state = await getTeamsPageState(searchParams);

  return <TeamsScreen {...state} routeBase="/groups" data={state.screenData} />;
}
