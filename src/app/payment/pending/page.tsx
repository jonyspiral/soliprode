import { PaymentStatusCard } from "@/components/payments/payment-status-card";
import {
  buildPaymentReturnPath,
  readPaymentReturnParams,
  resolvePaymentReturn,
} from "@/lib/payments/payment-return";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type PaymentReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentPendingPage({ searchParams }: PaymentReturnPageProps) {
  const params = await searchParams;
  const returnParams = readPaymentReturnParams(params);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.info("[payments:return:pending] received", {
    collectionId: returnParams.collectionId,
    externalReference: returnParams.externalReference,
    merchantOrderId: returnParams.merchantOrderId,
    paymentId: returnParams.paymentId,
    preferenceId: returnParams.preferenceId,
    status: returnParams.status,
    hasUser: Boolean(user),
  });

  if (
    !returnParams.externalReference &&
    !returnParams.paymentId &&
    !returnParams.collectionId &&
    !returnParams.preferenceId
  ) {
    return (
      <PaymentStatusCard
        title="Pago pendiente"
        description="Todavía no hay confirmación final."
        notice="Si ya pagaste, reintentá en unos minutos desde tu panel. La participación no se activa solo por esta pantalla."
        tone="info"
      />
    );
  }

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(buildPaymentReturnPath("pending", params))}`);
  }

  const { attempt, syncResult } = await resolvePaymentReturn(returnParams);

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

  if (syncResult?.syncResult.approved) {
    redirect("/dashboard");
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
