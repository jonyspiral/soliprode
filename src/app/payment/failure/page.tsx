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

export default async function PaymentFailurePage({ searchParams }: PaymentReturnPageProps) {
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
        title="Pago no completado"
        description="Tu participación sigue pendiente."
        notice="Podés volver a intentar con Mercado Pago o informar un pago manual si tuviste un problema."
        tone="error"
      />
    );
  }

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/payment/failure?external_reference=${externalReference}`)}`);
  }

  const attempt = await getPaymentAttemptByExternalReference(externalReference);

  if (!attempt || attempt.profile_id !== user.id) {
    return (
      <PaymentStatusCard
        title="Pago no completado"
        description="No pudimos asociar este intento a tu cuenta actual."
        notice="El retorno fallido no activa la participación. Si volvés a intentar, el sistema crea un nuevo intento trazable."
        tone="error"
      />
    );
  }

  const syncResult = await syncPaymentAttemptFromExternalReference(externalReference);

  if (syncResult?.syncResult.approved) {
    redirect("/dashboard");
  }

  return (
    <PaymentStatusCard
      title="Pago no completado"
      description="Mercado Pago no confirmó tu pago como aprobado."
      notice="Tu participación sigue pendiente. Podés volver a intentar con Mercado Pago o usar el fallback manual desde el panel."
      tone="error"
      primaryLabel="Volver al panel"
    />
  );
}
