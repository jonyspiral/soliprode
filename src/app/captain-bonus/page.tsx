import { redirect } from "next/navigation";

type LegacyCaptainBonusPageProps = {
  searchParams?: Promise<{
    code?: string;
  }>;
};

export default async function LegacyCaptainBonusPage({ searchParams }: LegacyCaptainBonusPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const code = params?.code?.trim() ?? "";

  if (code) {
    redirect(`/groups/captain-bonus?code=${encodeURIComponent(code)}`);
  }

  redirect("/groups");
}
