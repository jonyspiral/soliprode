import { NextResponse } from "next/server";
import { getServerSessionState } from "@/lib/auth/session-state";

export async function GET() {
  try {
    const sessionState = await getServerSessionState();

    return NextResponse.json({
      authenticated: sessionState.isAuthenticated,
      avatarUrl: sessionState.avatarUrl,
      isPaid: sessionState.isPaid,
      paymentStatus: sessionState.paymentStatus,
      userId: sessionState.userId,
    });
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
        avatarUrl: null,
        isPaid: false,
        paymentStatus: null,
        userId: null,
      },
      { status: 500 },
    );
  }
}
