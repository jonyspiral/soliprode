import { PaymentStatusCard } from "@/components/payments/payment-status-card";
import {
  getPaymentAttemptByExternalReference,
  syncPaymentAttemptFromExternalReference,
} from "@/lib/payments/payment-attempts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type PaymentReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PaymentSuccessPage({ searchParams }: PaymentReturnPageProps) {
  const params = await searchParams;
  const externalReference =
    typeof params.external_reference === "string" ? params.external_reference : null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!externalReference) {
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
    redirect(`/login?next=${encodeURIComponent(`/payment/success?external_reference=${externalReference}`)}`);
  }

  const attempt = await getPaymentAttemptByExternalReference(externalReference);

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

  const syncResult = await syncPaymentAttemptFromExternalReference(externalReference);

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
