import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory rate limiting map for edge/middleware protection
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  // 1. Rate Limiting on auth and checkin endpoints
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/checkin")) {
    const isAllowed = checkRateLimit(ip, 30, 60000);
    if (!isAllowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again in 1 minute." }),
        { status: 429, headers: { "content-type": "application/json" } }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
