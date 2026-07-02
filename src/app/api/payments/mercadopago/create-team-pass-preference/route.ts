import { NextRequest, NextResponse } from "next/server";
import { createMercadoPagoCheckoutForTeamPass } from "@/lib/payments/payment-attempts";
import { hasMercadoPagoAccessToken } from "@/lib/payments/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type TeamPassPayload = {
  slotQuantity?: unknown;
  teamId?: unknown;
};

function readSlotQuantity(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }

  return null;
}

function readTeamId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
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
        error: "Necesitás iniciar sesión para pagar cupos del Team.",
      },
      { status: 401 },
    );
  }

  let body: TeamPassPayload = {};

  try {
    body = (await request.json()) as TeamPassPayload;
  } catch {
    body = {};
  }

  const slotQuantity = readSlotQuantity(body.slotQuantity);
  const teamId = readTeamId(body.teamId);

  if (!slotQuantity || !teamId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Faltan el Team o la cantidad de cupos para abrir el checkout.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createMercadoPagoCheckoutForTeamPass({
      profileId: user.id,
      email: user.email ?? null,
      teamId,
      slotQuantity,
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
            error: "No encontramos tu participación actual.",
          },
          { status: 404 },
        );
      }

      if (error.message === "team_not_found") {
        return NextResponse.json(
          {
            ok: false,
            error: "No encontramos ese Team.",
          },
          { status: 404 },
        );
      }

      if (error.message === "team_pass_forbidden") {
        return NextResponse.json(
          {
            ok: false,
            error: "Solo el Capitán puede comprar cupos prepagos para este Team.",
          },
          { status: 403 },
        );
      }

      if (error.message === "team_pass_requires_paid_captain") {
        return NextResponse.json(
          {
            ok: false,
            error: "Primero necesitás tener tu Pase activo para comprar cupos del Team.",
          },
          { status: 409 },
        );
      }

      if (error.message === "invalid_team_slot_quantity") {
        return NextResponse.json(
          {
            ok: false,
            error: "Elegí una cantidad válida de cupos para el Team.",
          },
          { status: 400 },
        );
      }
    }

    console.error("[payments:create-team-pass-preference] failed", {
      profileId: user.id,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack:
        process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "No pudimos abrir el checkout de cupos para el Team ahora.",
      },
      { status: 500 },
    );
  }
}
