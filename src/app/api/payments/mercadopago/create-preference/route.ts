import { NextResponse } from "next/server";
import { createMercadoPagoCheckoutForParticipation } from "@/lib/payments/payment-attempts";
import { hasMercadoPagoAccessToken } from "@/lib/payments/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    return NextResponse.json(
      {
        ok: false,
        error: "No pudimos iniciar el pago con Mercado Pago en este momento.",
      },
      { status: 500 },
    );
  }
}
