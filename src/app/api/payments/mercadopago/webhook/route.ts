import { NextRequest, NextResponse } from "next/server";
import {
  getMercadoPagoWebhookSecret,
  hasMercadoPagoAccessToken,
} from "@/lib/payments/config";
import { syncPaymentAttemptFromPaymentId } from "@/lib/payments/payment-attempts";

type MercadoPagoWebhookBody = {
  action?: string;
  api_version?: string;
  data?: {
    id?: string | number;
  };
  id?: string | number;
  live_mode?: boolean;
  topic?: string;
  type?: string;
};

export async function POST(request: NextRequest) {
  if (!hasMercadoPagoAccessToken()) {
    return NextResponse.json({ ok: false, error: "mercadopago_not_configured" }, { status: 503 });
  }

  const webhookSecret = getMercadoPagoWebhookSecret();
  const secretFromQuery = request.nextUrl.searchParams.get("token");

  if (webhookSecret && secretFromQuery !== webhookSecret) {
    return NextResponse.json({ ok: false, error: "invalid_webhook_secret" }, { status: 401 });
  }

  let body: MercadoPagoWebhookBody = {};

  try {
    body = (await request.json()) as MercadoPagoWebhookBody;
  } catch {
    body = {};
  }

  const paymentIdFromQuery =
    request.nextUrl.searchParams.get("data.id") ??
    request.nextUrl.searchParams.get("id") ??
    request.nextUrl.searchParams.get("payment_id") ??
    request.nextUrl.searchParams.get("collection_id");

  const paymentId = body.data?.id ?? body.id ?? paymentIdFromQuery;

  console.info("[payments:webhook] received", {
    action: body.action ?? null,
    apiVersion: body.api_version ?? null,
    id: body.id ?? null,
    dataId: body.data?.id ?? null,
    liveMode: body.live_mode ?? null,
    topic: body.topic ?? null,
    type: body.type ?? null,
    queryPaymentId: paymentIdFromQuery ?? null,
  });

  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: "missing_payment_id" });
  }

  try {
    const result = await syncPaymentAttemptFromPaymentId(paymentId);

    console.info("[payments:webhook] sync result", {
      paymentId: String(paymentId),
      synced: Boolean(result),
      approved: result?.syncResult.approved ?? false,
      attemptId: result?.attempt.id ?? null,
      externalReference: result?.attempt.external_reference ?? null,
      attemptStatus: result?.syncResult.attemptStatus ?? null,
      participationStatus: result?.syncResult.participationStatus ?? null,
    });

    return NextResponse.json({
      ok: true,
      synced: Boolean(result),
      approved: result?.syncResult.approved ?? false,
    });
  } catch (error) {
    console.error("[payments:webhook] sync failed", {
      paymentId: String(paymentId),
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack:
        process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ ok: false, error: "webhook_sync_failed" }, { status: 500 });
  }
}
