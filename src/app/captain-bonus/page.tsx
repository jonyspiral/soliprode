import { redirect } from "next/navigation";
import { InfoNotice, PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { claimCaptainBonusInvite, getCaptainBonusInviteByCode } from "@/lib/captain-bonus/service";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type CaptainBonusPageProps = {
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

export default async function CaptainBonusPage({ searchParams }: CaptainBonusPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const code = params?.code?.trim() ?? "";

  if (!code) {
    return (
      <PageStack>
        <SurfaceCard title="Pase Capitán Bonificado" description="Necesitás un link válido para activar este beneficio.">
          <InfoNotice tone="error" message="Falta el código de invitación." />
        </SurfaceCard>
      </PageStack>
    );
  }

  const invite = await getCaptainBonusInviteByCode(code);

  if (!invite) {
    return (
      <PageStack>
        <SurfaceCard title="Invitación no encontrada" description="Ese link no existe o ya no está disponible.">
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
    redirect(`/login?next=${encodeURIComponent(`/captain-bonus?code=${code}`)}`);
  }

  const bootstrapResult = await ensureRegisteredUserRecords(user);

  if (!bootstrapResult.ok) {
    return (
      <PageStack>
        <SurfaceCard title="Pase Capitán Bonificado" description="Tu sesión está abierta, pero no pudimos preparar tu cuenta.">
          <InfoNotice tone="error" message={bootstrapResult.error} />
        </SurfaceCard>
      </PageStack>
    );
  }

  try {
    await claimCaptainBonusInvite({
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

    if (message === "captain_bonus_claimed") {
      redirect(buildGroupsErrorRedirect("Ese link ya fue reclamado.", code));
    }

    if (message === "captain_bonus_expired") {
      redirect(buildGroupsErrorRedirect("Ese link ya venció.", code));
    }

    if (message === "captain_bonus_revoked") {
      redirect(buildGroupsErrorRedirect("Ese link fue revocado.", code));
    }

    if (message === "captain_bonus_not_found") {
      redirect(buildGroupsErrorRedirect("No encontramos ese link de Capitán Bonificado.", code));
    }

    if (message === "missing_participation") {
      redirect(buildGroupsErrorRedirect("No pudimos preparar tu inscripción para activar este beneficio.", code));
    }

    return (
      <PageStack>
        <SurfaceCard title="Pase Capitán Bonificado" description="No pudimos activar el beneficio ahora.">
          <InfoNotice tone="error" message="Reintentá en unos minutos o pedí al Admin un nuevo link." />
        </SurfaceCard>
      </PageStack>
    );
  }

  redirect("/groups?notice=Tu Pase Capitán Bonificado ya quedó activo. Ahora armá tu Team.");
}
