import { redirect } from "next/navigation";
import { PaymentStatusCard } from "@/components/payments/payment-status-card";
import {
  buildPaymentReturnPath,
  readPaymentReturnParams,
  resolvePaymentReturn,
} from "@/lib/payments/payment-return";
import { getCheckoutKindForAttempt } from "@/lib/payments/payment-attempts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickPrimaryParticipation } from "@/lib/participations/primary";

type PaymentReturnScreenProps = {
  kind: "success" | "pending" | "failure";
  searchParams: Record<string, string | string[] | undefined>;
};

export async function PaymentReturnScreen({ kind, searchParams }: PaymentReturnScreenProps) {
  const returnParams = readPaymentReturnParams(searchParams);
  const hasReturnIdentifiers = Boolean(
    returnParams.externalReference ||
      returnParams.paymentId ||
      returnParams.collectionId ||
      returnParams.preferenceId,
  );

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasReturnIdentifiers) {
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
          title="El pago no se completó"
          description="Todavía no activaste tu Pase Solidario."
          notice="Podés volver a intentar el pago online. No necesitás cuenta de Mercado Pago."
          primaryHref="/activar-pase"
          primaryLabel="Intentar pagar nuevamente"
          secondaryHref="/"
          secondaryLabel="Volver al inicio"
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

  const { data: participationRows } = await supabase
    .from("participations")
    .select("id, payment_status, group_id, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const currentParticipation = pickPrimaryParticipation(
    (participationRows ?? []) as Array<{
      id: string;
      payment_status: string;
      group_id: string | null;
      created_at: string;
    }>,
  ).participation;

  const { attempt, syncResult } = await resolvePaymentReturn(returnParams);

  if (!attempt || attempt.profile_id !== user.id) {
    return (
      <PaymentStatusCard
        title={
          kind === "failure"
            ? "No se pudo activar tu Pase"
            : kind === "pending"
              ? "El pago no se completó"
              : "Estamos confirmando tu pago"
        }
        description="No pudimos asociar este retorno a tu participación actual."
        notice="El retorno solo informa el estado visual. La activación real depende del webhook o de una verificación server-side confiable."
        tone={kind === "failure" ? "error" : "info"}
        primaryHref="/activar-pase"
        primaryLabel={kind === "failure" ? "Intentar nuevamente" : "Intentar pagar nuevamente"}
        secondaryHref="/"
        secondaryLabel="Volver al inicio"
      />
    );
  }

  if (getCheckoutKindForAttempt(attempt) === "team_pass") {
    if (syncResult?.syncResult.approved || attempt.status === "paid") {
      redirect("/groups?notice=Los cupos prepagos del Team ya quedaron listos para invitar jugadores.");
    }

    return (
      <PaymentStatusCard
        title={kind === "failure" ? "No se pudo comprar el pase de equipo" : "Estamos confirmando los cupos del Team"}
        description={
          kind === "failure"
            ? "La compra de cupos prepagos no quedó confirmada."
            : "Cuando Mercado Pago confirme la operación, los links de invitación van a quedar disponibles en tu Team."
        }
        notice="Los cupos no crean jugadores automáticos. Cada invitado real tiene que reclamar su lugar con cuenta propia."
        tone={kind === "failure" ? "error" : "info"}
        primaryHref="/groups"
        primaryLabel={kind === "failure" ? "Volver a mi Team" : "Ver mi Team"}
        secondaryHref={kind === "failure" ? "/activar-pase" : "/"}
        secondaryLabel={kind === "failure" ? "Volver al Pase" : "Volver al inicio"}
      />
    );
  }

  if (syncResult?.syncResult.approved || currentParticipation?.payment_status === "paid") {
    redirect("/despues-del-pago");
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
    const attemptLooksPending = attempt.status === "payment_pending" || attempt.status === "manual_review";

    return (
      <PaymentStatusCard
        title={attemptLooksPending ? "Tu pago quedó pendiente" : "El pago no se completó"}
        description={
          attemptLooksPending
            ? "Mercado Pago todavía no confirmó el cobro."
            : "Tu activación sigue sin confirmarse."
        }
        notice={
          attemptLooksPending
            ? "Cuando la operación cambie de estado, tu Pase Solidario se activará automáticamente."
            : "Podés volver a intentar el checkout desde la activación de tu Pase."
        }
        primaryHref="/activar-pase"
        primaryLabel={attemptLooksPending ? "Ver mi activación" : "Intentar pagar nuevamente"}
        secondaryHref={attemptLooksPending ? "/" : "/matches"}
        secondaryLabel={attemptLooksPending ? "Volver al inicio" : "Ver partidos"}
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
