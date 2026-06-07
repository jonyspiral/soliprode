import Link from "next/link";
import { redirect } from "next/navigation";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PaidParticipationRow = {
  id: string;
  payment_status: string;
  group_id: string | null;
  created_at: string;
};

export default async function PostCheckoutPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/despues-del-pago");
  }

  const { data: participationRows } = await supabase
    .from("participations")
    .select("id, payment_status, group_id, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const participation = pickPrimaryParticipation(
    (participationRows ?? []) as PaidParticipationRow[],
  ).participation;

  if (!participation || participation.payment_status !== "paid") {
    redirect("/activar-pase");
  }

  if (participation.group_id) {
    redirect("/dashboard");
  }

  return (
    <PageStack>
      <section className="mx-auto w-full max-w-[31rem]">
        <SurfaceCard
          title="Tu Pase ya está activo"
          description="Ya podés cargar pronósticos, competir por premios y seguir sumando puntos."
          tone="accent"
        >
          <div className="grid gap-4">
            <div className="grid gap-2">
              <h2 className="font-serif text-[2rem] font-bold uppercase leading-none text-[var(--color-primary)]">
                ¿Querés armar un Team?
              </h2>
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                Invitá a tus amigos, compañeros o familia y compitan juntos por la gloria.
              </p>
            </div>

            <div className="grid gap-3">
              <Link
                href="/groups"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[#e7ca55] bg-[#ffe16d] px-5 py-3 text-[0.82rem] font-extrabold uppercase tracking-[0.09em] text-[var(--color-ink)]"
              >
                Quiero
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--color-line)] bg-white px-5 py-3 text-[0.82rem] font-bold uppercase tracking-[0.08em] text-[var(--color-primary)]"
              >
                No quiero
              </Link>
            </div>
          </div>
        </SurfaceCard>
      </section>
    </PageStack>
  );
}
