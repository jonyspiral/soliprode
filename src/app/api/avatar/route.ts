import { NextResponse } from "next/server";

const ALLOWED_AVATAR_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
]);

function isAllowedAvatarUrl(source: string) {
  try {
    const url = new URL(source);
    return url.protocol === "https:" && ALLOWED_AVATAR_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("src");

  if (!source || !isAllowedAvatarUrl(source)) {
    return new NextResponse("Avatar source not allowed.", { status: 400 });
  }

  try {
    const upstreamResponse = await fetch(source, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!upstreamResponse.ok) {
      return new NextResponse("Avatar unavailable.", { status: upstreamResponse.status });
    }

    const contentType = upstreamResponse.headers.get("content-type") ?? "image/jpeg";
    const cacheControl = upstreamResponse.headers.get("cache-control") ?? "public, max-age=86400";
    const imageBuffer = await upstreamResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Cache-Control": cacheControl,
        "Content-Type": contentType,
      },
    });
  } catch {
    return new NextResponse("Avatar unavailable.", { status: 502 });
  }
}
