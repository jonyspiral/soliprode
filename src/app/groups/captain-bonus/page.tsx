import { redirect } from "next/navigation";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { claimCaptainBonusCampaign, getCaptainBonusCampaignByCode } from "@/lib/captain-bonus/service";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type GroupsCaptainBonusPageProps = {
  searchParams?: Promise<{
    code?: string;
  }>;
};

function buildGroupsErrorRedirect(message: string, code: string) {
  const params = new URLSearchParams();
  params.set("error", message);
  params.set("captain_bonus_code", code);
  return `/groups?${params.toString()}`;
}

export default async function GroupsCaptainBonusPage({ searchParams }: GroupsCaptainBonusPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const code = params?.code?.trim() ?? "";

  if (!code) {
    return (
      <PageStack>
        <SurfaceCard title="Capitán Bonificado" description="Necesitás un link válido para reclamar este pase.">
          <InfoNotice tone="error" message="Falta el código de campaña." />
        </SurfaceCard>
      </PageStack>
    );
  }

  const campaign = await getCaptainBonusCampaignByCode(code);

  if (!campaign) {
    return (
      <PageStack>
        <SurfaceCard title="Campaña no encontrada" description="Ese link no existe o ya no está disponible.">
          <InfoNotice tone="error" message="Pedile al Admin un link nuevo de Capitán Bonificado." />
        </SurfaceCard>
      </PageStack>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/groups/captain-bonus?code=${code}`)}`);
  }

  const bootstrapResult = await ensureRegisteredUserRecords(user);

  if (!bootstrapResult.ok) {
    return (
      <PageStack>
        <SurfaceCard title="Capitán Bonificado" description="Tu sesión está abierta, pero no pudimos preparar tu cuenta.">
          <InfoNotice tone="error" message={bootstrapResult.error} />
        </SurfaceCard>
      </PageStack>
    );
  }

  try {
    await claimCaptainBonusCampaign({
      code,
      profileId: user.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "captain_bonus_claim_failed";

    if (message === "already_paid") {
      redirect(buildGroupsErrorRedirect("Tu cuenta ya tiene un Pase activo. Este beneficio ya no aplica.", code));
    }

    if (message === "captain_bonus_already_active") {
      redirect("/groups?notice=Tu Pase Capitán Bonificado ya estaba activo.");
    }

    if (message === "captain_bonus_exhausted") {
      redirect(buildGroupsErrorRedirect("Esta campaña ya agotó sus cupos.", code));
    }

    if (message === "captain_bonus_expired") {
      redirect(buildGroupsErrorRedirect("Esta campaña ya venció.", code));
    }

    if (message === "captain_bonus_cancelled") {
      redirect(buildGroupsErrorRedirect("Esta campaña fue cancelada.", code));
    }

    if (message === "captain_bonus_not_found") {
      redirect(buildGroupsErrorRedirect("No encontramos esta campaña de Capitán Bonificado.", code));
    }

    if (message === "missing_participation") {
      redirect(buildGroupsErrorRedirect("No pudimos preparar tu inscripción para activar este beneficio.", code));
    }

    return (
      <PageStack>
        <SurfaceCard title="Capitán Bonificado" description="No pudimos activar el beneficio ahora.">
          <InfoNotice tone="error" message="Reintentá en unos minutos o pedí un nuevo link al Admin." />
        </SurfaceCard>
      </PageStack>
    );
  }

  redirect("/groups?notice=Tu Pase Capitán Bonificado ya quedó activo. Ahora armá o compartí tu Team.");
}
