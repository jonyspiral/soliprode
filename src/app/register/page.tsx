import { redirect } from "next/navigation";

type RegisterPageProps = {
  searchParams?: Promise<{
    p?: string;
    promoter?: string;
    next?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const nextPath = params?.next?.startsWith("/") ? params.next : "/dashboard";
  const loginParams = new URLSearchParams({ next: nextPath });

  if (params?.p) {
    loginParams.set("p", params.p);
  }

  if (params?.promoter) {
    loginParams.set("promoter", params.promoter);
  }

  redirect(`/login?${loginParams.toString()}`);
}
