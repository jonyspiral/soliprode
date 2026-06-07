import { redirect } from "next/navigation";
import { ActivationPanel } from "@/components/participation/activation-panel";
import { PageStack } from "@/components/placeholder-primitives";
import { SurfaceCard } from "@/components/surface-card";
import { getBankTransferConfig } from "@/lib/payments/bank-transfer";
import { pickPrimaryParticipation } from "@/lib/participations/primary";
import { syncPendingPaymentAttemptsForParticipation } from "@/lib/payments/payment-attempts";
import { ensureRegisteredUserRecords } from "@/lib/supabase/bootstrap";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { withSupabaseTimeout } from "@/lib/supabase/timeouts";

const SYNCABLE_PAYMENT_STATUSES = new Set(["payment_started", "payment_pending", "manual_review"]);

type ParticipationRow = {
  id: string;
  payment_status: string;
  payment_provider: string | null;
  created_at: string;
  rules_accepted_at: string | null;
  rules_version: string | null;
  is_adult_confirmed: boolean | null;
};

type ActivatePassPageProps = {
  searchParams?: Promise<{
    checkout_error?: string;
    transfer_error?: string;
    transfer_notice?: string;
  }>;
};

function resolveCheckoutErrorMessage(checkoutError: string | undefined) {
  switch (checkoutError) {
    case "rules_required":
      return "Aceptá el reglamento para continuar con la activación del Pase.";
    case "rules_persist_failed":
      return "No pudimos guardar la aceptación del reglamento ahora. Intentá de nuevo.";
    case "missing_participation":
      return "No encontramos tu participación todavía. Reintentá en unos minutos.";
    case "mercadopago_not_configured":
      return "El pago online todavía no está configurado.";
    case "checkout_unavailable":
      return "No pudimos abrir el checkout ahora. Probá de nuevo.";
    default:
      return null;
  }
}

function resolveTransferErrorMessage(transferError: string | undefined) {
  switch (transferError) {
    case "rules_required":
      return "Aceptá el reglamento para avisar tu transferencia.";
    case "rules_persist_failed":
      return "No pudimos guardar la aceptación del reglamento ahora. Intentá de nuevo.";
    case "missing_participation":
      return "No encontramos tu participación todavía. Reintentá en unos minutos.";
    case "manual_transfer_unavailable":
      return "La transferencia manual no está disponible ahora.";
    default:
      return null;
  }
}

function resolveTransferNoticeMessage(transferNotice: string | undefined) {
  switch (transferNotice) {
    case "submitted":
      return "Registramos tu transferencia. La activación no es automática: la vamos a revisar antes de activar tu Pase.";
    default:
      return null;
  }
}

async function loadParticipation(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
) {
  const participationResult = await withSupabaseTimeout(
    Promise.resolve(
      supabase
        .from("participations")
        .select("id, payment_status, payment_provider, created_at, rules_accepted_at, rules_version, is_adult_confirmed")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ),
    "Supabase activation query timed out",
  );

  return pickPrimaryParticipation((participationResult.data ?? []) as ParticipationRow[]).participation ?? null;
}

export default async function ActivatePassPage({ searchParams }: ActivatePassPageProps) {
  const params = searchParams ? await searchParams : undefined;
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
        participationProvider={participation.payment_provider}
        initialCheckoutError={resolveCheckoutErrorMessage(params?.checkout_error)}
        initialTransferError={resolveTransferErrorMessage(params?.transfer_error)}
        initialTransferNotice={resolveTransferNoticeMessage(params?.transfer_notice)}
        initialRulesAcceptedAt={participation.rules_accepted_at}
        initialRulesVersion={participation.rules_version}
        initialIsAdultConfirmed={Boolean(participation.is_adult_confirmed)}
        bankTransferConfig={getBankTransferConfig()}
      />
    </PageStack>
  );
}
