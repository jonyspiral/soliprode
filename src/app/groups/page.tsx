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
      "SoliProde Teams dentro de la app. Armá tu Team, mirá tu 11 titular, el Banco y el ranking competitivo.",
  },
  twitter: {
    card: "summary",
    title: "Groups | SoliProde",
    description:
      "SoliProde Teams dentro de la app. Armá tu Team, mirá tu 11 titular, el Banco y el ranking competitivo.",
    images: ["/groups/opengraph-image"],
  },
};

type GroupsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> | undefined>;
};

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const state = await getTeamsPageState(searchParams);

  return <TeamsScreen {...state} routeBase="/groups" data={state.screenData} />;
}
