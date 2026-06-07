import { redirect } from "next/navigation";
import { PaymentStatusCard } from "@/components/payments/payment-status-card";
import {
  buildPaymentReturnPath,
  readPaymentReturnParams,
  resolvePaymentReturn,
} from "@/lib/payments/payment-return";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type PaymentReturnScreenProps = {
  kind: "success" | "pending" | "failure";
  searchParams: Record<string, string | string[] | undefined>;
};

export async function PaymentReturnScreen({ kind, searchParams }: PaymentReturnScreenProps) {
  const returnParams = readPaymentReturnParams(searchParams);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !returnParams.externalReference &&
    !returnParams.paymentId &&
    !returnParams.collectionId &&
    !returnParams.preferenceId
  ) {
    if (kind === "success") {
      return (
        <PaymentStatusCard
          title="Estamos confirmando tu pago"
          description="Volvé a ingresar para revisar el estado real de tu Pase Solidario."
          notice="El retorno no activa tu Pase por sí solo. La activación depende del webhook o de una verificación server-side confiable."
          primaryHref="/activar-pase"
          primaryLabel="Volver a activar mi Pase"
        />
      );
    }

    if (kind === "pending") {
      return (
        <PaymentStatusCard
          title="Tu pago quedó pendiente"
          description="Todavía no hay confirmación final."
          notice="Cuando Mercado Pago confirme la operación, tu Pase Solidario se activará automáticamente."
          primaryHref="/activar-pase"
          primaryLabel="Volver a activar mi Pase"
        />
      );
    }

    return (
      <PaymentStatusCard
        title="No se pudo activar tu Pase"
        description="Tu pago no quedó confirmado."
        notice="Podés intentarlo nuevamente desde la pantalla de activación."
        tone="error"
        primaryHref="/activar-pase"
        primaryLabel="Intentar nuevamente"
      />
    );
  }

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(buildPaymentReturnPath(kind, searchParams))}`);
  }

  const { attempt, syncResult } = await resolvePaymentReturn(returnParams);

  if (!attempt || attempt.profile_id !== user.id) {
    return (
      <PaymentStatusCard
        title={kind === "failure" ? "No se pudo activar tu Pase" : kind === "pending" ? "Tu pago quedó pendiente" : "Estamos confirmando tu pago"}
        description="No pudimos asociar este retorno a tu participación actual."
        notice="El retorno solo informa el estado visual. La activación real depende del webhook o de una verificación server-side confiable."
        tone={kind === "failure" ? "error" : "info"}
        primaryHref="/activar-pase"
        primaryLabel={kind === "failure" ? "Intentar nuevamente" : "Volver a activar mi Pase"}
      />
    );
  }

  if (syncResult?.syncResult.approved) {
    return (
      <PaymentStatusCard
        title="Tu Pase Solidario ya está activo"
        description="El pago quedó confirmado y ya podés competir."
        notice="Tu Aporte confirmado ya habilita pronósticos, Team y ranking oficial."
        primaryHref="/matches"
        primaryLabel="Cargar mis pronósticos"
        secondaryHref="/"
        secondaryLabel="Ir al inicio"
      />
    );
  }

  if (kind === "success") {
    return (
      <PaymentStatusCard
        title="Estamos confirmando tu pago"
        description="Tu pago fue recibido. En unos segundos se activa tu Pase."
        notice="Si Mercado Pago todavía no confirmó la operación, el webhook o la verificación server-side la terminarán de reflejar."
        primaryHref={buildPaymentReturnPath("success", searchParams)}
        primaryLabel="Actualizar estado"
        secondaryHref="/activar-pase"
        secondaryLabel="Volver a activar mi Pase"
      />
    );
  }

  if (kind === "pending") {
    return (
      <PaymentStatusCard
        title="Tu pago quedó pendiente"
        description="Mercado Pago todavía no confirmó el cobro."
        notice="Cuando la operación cambie de estado, tu Pase Solidario se activará automáticamente."
        primaryHref="/"
        primaryLabel="Volver al inicio"
        secondaryHref="/activar-pase"
        secondaryLabel="Ver mi activación"
      />
    );
  }

  return (
    <PaymentStatusCard
      title="No se pudo activar tu Pase"
      description="No se confirmó el pago."
      notice="Podés intentarlo nuevamente desde la pantalla de activación."
      tone="error"
      primaryHref="/activar-pase"
      primaryLabel="Intentar nuevamente"
      secondaryHref="/"
      secondaryLabel="Volver al inicio"
    />
  );
}
