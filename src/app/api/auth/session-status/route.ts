import { NextResponse } from "next/server";
import { getServerSessionState } from "@/lib/auth/session-state";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const sessionState = await getServerSessionState();

    return NextResponse.json(
      {
        authenticated: sessionState.isAuthenticated,
        avatarUrl: sessionState.avatarUrl,
        isPaid: sessionState.isPaid,
        paymentStatus: sessionState.paymentStatus,
        userId: sessionState.userId,
      },
      { headers: noStoreHeaders },
    );
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
        avatarUrl: null,
        isPaid: false,
        paymentStatus: null,
        userId: null,
      },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
