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

export default async function PaymentSuccessPage({ searchParams }: PaymentReturnPageProps) {
  const params = await searchParams;
  const returnParams = readPaymentReturnParams(params);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.info("[payments:return:success] received", {
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
        title="Pago recibido"
        description="Volvé a ingresar para verificar tu estado real."
        notice="No pudimos verificar este intento de pago todavía. Ingresá al panel y revisá el estado de tu participación."
        tone="info"
      />
    );
  }

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(buildPaymentReturnPath("success", params))}`);
  }

  const { attempt, syncResult } = await resolvePaymentReturn(returnParams);

  if (!attempt || attempt.profile_id !== user.id) {
    return (
      <PaymentStatusCard
        title="Pago recibido"
        description="No pudimos asociar este retorno a tu participación actual."
        notice="El pago no se activa por volver desde Mercado Pago. Solo cuenta cuando la verificación server-side o el webhook confirman que está aprobado."
        tone="info"
      />
    );
  }

  if (syncResult?.syncResult.approved) {
    redirect("/dashboard");
  }

  return (
    <PaymentStatusCard
      title="Pago en revisión"
      description="Mercado Pago devolvió el flujo, pero tu participación todavía no se activa sola."
      notice="Todavía estamos esperando confirmación final de Mercado Pago o webhook. Mientras tanto, tus pronósticos siguen guardados como borrador."
      tone="info"
    />
  );
}
