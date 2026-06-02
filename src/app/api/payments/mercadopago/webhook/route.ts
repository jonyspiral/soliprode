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

  const body = (await request.json()) as MercadoPagoWebhookBody;
  const paymentId = body.data?.id ?? body.id;

  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: "missing_payment_id" });
  }

  try {
    const result = await syncPaymentAttemptFromPaymentId(paymentId);

    return NextResponse.json({
      ok: true,
      synced: Boolean(result),
      approved: result?.syncResult.approved ?? false,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "webhook_sync_failed" }, { status: 500 });
  }
}
