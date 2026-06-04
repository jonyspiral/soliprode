import { NextResponse, type NextRequest } from "next/server";

const APEX_HOSTS = new Set(["soliprode.com"]);
const CANONICAL_HOST = "www.soliprode.com";

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host");
  const hostname = hostHeader?.split(":")[0]?.toLowerCase() ?? request.nextUrl.hostname.toLowerCase();

  if (!APEX_HOSTS.has(hostname)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.protocol = "https";
  redirectUrl.host = CANONICAL_HOST;
  redirectUrl.port = "";

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|apple-touch-icon.png).*)"],
};
