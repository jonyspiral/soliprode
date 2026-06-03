import { NextResponse } from "next/server";
import { createMercadoPagoCheckoutForParticipation } from "@/lib/payments/payment-attempts";
import { hasMercadoPagoAccessToken } from "@/lib/payments/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DiagnosticErrorShape = {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  status?: unknown;
  cause?: unknown;
};

function readObjectRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

function buildErrorDiagnostics(error: unknown) {
  const typedError = error as DiagnosticErrorShape | null;
  const causeRecord = readObjectRecord(typedError?.cause);

  return {
    name: typedError?.name ?? null,
    message: typedError?.message ?? null,
    stack:
      process.env.NODE_ENV === "development" && typeof typedError?.stack === "string"
        ? typedError.stack
        : undefined,
    supabase:
      typedError?.code || typedError?.details || typedError?.hint
        ? {
            code: typedError.code ?? null,
            message: typedError.message ?? null,
            details: typedError.details ?? null,
            hint: typedError.hint ?? null,
          }
        : null,
    mercadoPago:
      typedError?.status || causeRecord?.status || causeRecord?.message || causeRecord?.cause
        ? {
            status: typedError?.status ?? causeRecord?.status ?? null,
            message: causeRecord?.message ?? typedError?.message ?? null,
            cause: causeRecord?.cause ?? typedError?.cause ?? null,
          }
        : null,
  };
}

export async function POST() {
  if (!hasMercadoPagoAccessToken()) {
    return NextResponse.json(
      {
        ok: false,
        error: "El pago online todavia no esta configurado.",
      },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: "Necesitás iniciar sesión para pagar tu participación.",
      },
      { status: 401 },
    );
  }

  try {
    const result = await createMercadoPagoCheckoutForParticipation({
      profileId: user.id,
      email: user.email ?? null,
    });

    if (!result.checkoutUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: "No pudimos generar la URL de pago en este momento.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      checkoutUrl: result.checkoutUrl,
      externalReference: result.paymentAttempt.external_reference,
      attemptId: result.paymentAttempt.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "missing_participation") {
        return NextResponse.json(
          {
            ok: false,
            error: "No encontramos tu participación todavía. Reintentá en unos minutos.",
          },
          { status: 404 },
        );
      }

      if (error.message === "already_paid") {
        return NextResponse.json(
          {
            ok: false,
            error: "Tu participación ya está paga y activa.",
          },
          { status: 409 },
        );
      }
    }

    console.error("[payments:create-preference] failed", {
      ...buildErrorDiagnostics(error),
      profileId: user.id,
      hasUserEmail: Boolean(user.email),
    });

    return NextResponse.json(
      {
        ok: false,
        error: "No pudimos abrir la inscripción ahora. Probá de nuevo.",
      },
      { status: 500 },
    );
  }
}
