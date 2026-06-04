import type { Metadata } from "next";
import { TeamsScreen } from "@/app/teams/_components/teams-screen";
import { getTeamsPageState } from "@/app/teams/_page-state";

export const metadata: Metadata = {
  title: "Teams",
  description:
    "SoliProde Teams. Armá tu Team, mirá tu 11 titular, el Banco y el ranking competitivo.",
  openGraph: {
    title: "Teams | SoliProde",
    description:
      "SoliProde Teams. Armá tu Team, mirá tu 11 titular, el Banco y el ranking competitivo.",
  },
  twitter: {
    card: "summary",
    title: "Teams | SoliProde",
    description:
      "SoliProde Teams. Armá tu Team, mirá tu 11 titular, el Banco y el ranking competitivo.",
    images: ["/teams/opengraph-image"],
  },
};

type TeamsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> | undefined>;
};

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const state = await getTeamsPageState(searchParams);

  return <TeamsScreen {...state} routeBase="/teams" data={state.screenData} />;
}
