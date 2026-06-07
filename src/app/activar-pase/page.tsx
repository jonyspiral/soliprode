import { redirect } from "next/navigation";
import { ActivationPanel } from "@/components/participation/activation-panel";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { syncPendingPaymentAttemptsForParticipation } from "@/lib/payments/payment-attempts";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

const SYNCABLE_PAYMENT_STATUSES = new Set(["payment_started", "payment_pending", "manual_review"]);

type ParticipationRow = {
  id: string;
  payment_status: string;
  created_at: string;
  rules_accepted_at: string | null;
  rules_version: string | null;
  is_adult_confirmed: boolean | null;
};

async function loadParticipation(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  const participationResult = await withSupabaseTimeout(
    Promise.resolve(
      supabase
        .from("participations")
        .select("id, payment_status, created_at, rules_accepted_at, rules_version, is_adult_confirmed")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ),
    "Supabase activation query timed out",
  );

  return pickPrimaryParticipation((participationResult.data ?? []) as ParticipationRow[]).participation ?? null;
}

export default async function ActivatePassPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await withSupabaseTimeout(supabase.auth.getUser(), "Supabase session check timed out");

  if (!user) {
    redirect("/login?next=/activar-pase");
  }

  let participation = await loadParticipation(supabase, user.id);

  if (!participation) {
    const bootstrapResult = await ensureRegisteredUserRecords(user);

    if (!bootstrapResult.ok) {
      return (
        <PageStack>
          <SurfaceCard title="Activar Pase" description="No pudimos preparar tu cuenta para iniciar el pago.">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Reintentá en unos minutos o volvé a entrar para continuar con la activación.
            </p>
          </SurfaceCard>
        </PageStack>
      );
    }

    participation = await loadParticipation(supabase, user.id);
  }

  if (!participation) {
    return (
      <PageStack>
        <SurfaceCard title="Activar Pase" description="No encontramos tu participación actual.">
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Reintentá en unos minutos. Cuando la cuenta esté lista, vas a poder activar tu Pase Solidario.
          </p>
        </SurfaceCard>
      </PageStack>
    );
  }

  if (SYNCABLE_PAYMENT_STATUSES.has(participation.payment_status)) {
    try {
      const paymentSync = await syncPendingPaymentAttemptsForParticipation(participation.id);
      const syncedStatus = paymentSync?.syncResult.participationStatus;

      if (syncedStatus) {
        participation = {
          ...participation,
          payment_status: syncedStatus,
        };
      }
    } catch (error) {
      console.error("[payments:activar-pase-sync] failed", {
        participationId: participation.id,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <PageStack>
      <ActivationPanel
        participationId={participation.id}
        participationStatus={participation.payment_status}
        initialRulesAcceptedAt={participation.rules_accepted_at}
        initialRulesVersion={participation.rules_version}
        initialIsAdultConfirmed={Boolean(participation.is_adult_confirmed)}
      />
    </PageStack>
  );
}
