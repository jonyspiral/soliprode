import { PaymentStatusCard } from "@/components/payments/payment-status-card";
import {
  getPaymentAttemptByExternalReference,
  syncPaymentAttemptFromExternalReference,
} from "@/lib/payments/payment-attempts";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PaymentReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentPendingPage({ searchParams }: PaymentReturnPageProps) {
  const params = await searchParams;
  const externalReference =
    typeof params.external_reference === "string" ? params.external_reference : null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !externalReference) {
    return (
      <PaymentStatusCard
        title="Pago pendiente"
        description="Todavía no hay confirmación final."
        notice="Si ya pagaste, reintentá en unos minutos desde tu panel. La participación no se activa solo por esta pantalla."
        tone="info"
      />
    );
  }

  const attempt = await getPaymentAttemptByExternalReference(externalReference);

  if (!attempt || attempt.profile_id !== user.id) {
    return (
      <PaymentStatusCard
        title="Pago pendiente"
        description="No pudimos asociar este intento a tu cuenta actual."
        notice="Tu participación solo cambia de estado cuando la verificación server-side o el webhook confirman el pago real."
        tone="info"
      />
    );
  }

  const syncResult = await syncPaymentAttemptFromExternalReference(externalReference);

  if (syncResult?.syncResult.approved) {
    return (
      <PaymentStatusCard
        title="Pago aprobado"
        description="Tu participación ya quedó activa."
        notice="Aunque volviste por la ruta pendiente, la verificación real ya confirmó el pago."
        tone="info"
      />
    );
  }

  return (
    <PaymentStatusCard
      title="Pago pendiente"
      description="Mercado Pago todavía no confirmó el cobro como aprobado."
      notice="Tus pronósticos siguen guardados como borrador hasta que el webhook o la verificación server-side confirmen el pago."
      tone="info"
      primaryLabel="Revisar mi panel"
    />
  );
}
