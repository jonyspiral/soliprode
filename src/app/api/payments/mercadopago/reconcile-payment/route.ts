import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin/access";
import {
  getMercadoPagoWebhookSecret,
  hasMercadoPagoAccessToken,
} from "@/lib/payments/config";
import { syncPaymentAttemptFromPaymentId } from "@/lib/payments/payment-attempts";

type ReconcilePaymentBody = {
  payment_id?: unknown;
  paymentId?: unknown;
};

async function isAuthorized(request: NextRequest) {
  const webhookSecret = getMercadoPagoWebhookSecret();
  const token =
    request.nextUrl.searchParams.get("token") ??
    request.headers.get("x-reconcile-token");

  if (webhookSecret && token === webhookSecret) {
    return true;
  }

  try {
    await requireAdminUser();
    return true;
  } catch {
    return false;
  }
}

function readPaymentId(body: ReconcilePaymentBody) {
  const rawPaymentId = body.payment_id ?? body.paymentId;

  if (typeof rawPaymentId === "number" && Number.isFinite(rawPaymentId)) {
    return String(rawPaymentId);
  }

  if (typeof rawPaymentId === "string" && rawPaymentId.trim()) {
    return rawPaymentId.trim();
  }

  return null;
}

export async function POST(request: NextRequest) {
  if (!hasMercadoPagoAccessToken()) {
    return NextResponse.json({ ok: false, error: "mercadopago_not_configured" }, { status: 503 });
  }

  if (!(await isAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: ReconcilePaymentBody = {};

  try {
    body = (await request.json()) as ReconcilePaymentBody;
  } catch {
    body = {};
  }

  const paymentId = readPaymentId(body);

  if (!paymentId) {
    return NextResponse.json({ ok: false, error: "missing_payment_id" }, { status: 400 });
  }

  try {
    const result = await syncPaymentAttemptFromPaymentId(paymentId);

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          error: "payment_attempt_not_found",
          paymentId,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      paymentId,
      approved: result.syncResult.approved,
      attemptId: result.attempt.id,
      externalReference: result.attempt.external_reference,
      attemptStatus: result.syncResult.attemptStatus,
      participationStatus: result.syncResult.participationStatus,
    });
  } catch (error) {
    console.error("[payments:reconcile-payment] failed", {
      paymentId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack:
        process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ ok: false, error: "reconcile_failed" }, { status: 500 });
  }
}
