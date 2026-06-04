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
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "SoliProde",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Groups | SoliProde",
    description:
      "SoliProde Teams dentro de la app. Armá tu Team, mirá tu 11 titular, el Banco y el ranking competitivo.",
    images: ["/icon-512.png"],
  },
};

type GroupsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> | undefined>;
};

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const state = await getTeamsPageState(searchParams);

  return <TeamsScreen {...state} routeBase="/groups" data={state.screenData} />;
}
