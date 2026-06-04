import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { verifyToken } from "@/lib/jwt";

// Initialize NextAuth instance safe for Edge runtime (no database imports)
const { auth: nextAuthMiddleware } = NextAuth(authConfig);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Prevent header spoofing by stripping custom user context headers from the incoming request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-email");
  requestHeaders.delete("x-user-role");

  // 1. API Route Protection & User Forwarding
  if (pathname.startsWith("/api")) {
    // Skip verification check on auth API routes
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    const authHeader = request.headers.get("authorization");
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = await verifyToken(token);

      if (!decoded) {
        return new NextResponse(
          JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
          { status: 401, headers: { "content-type": "application/json" } }
        );
      }

      // Forward verified mobile user contexts
      requestHeaders.set("x-user-id", decoded.userId);
      requestHeaders.set("x-user-email", decoded.email);
      requestHeaders.set("x-user-role", decoded.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Fallback: Check if there's an active NextAuth web session
    const session = await (nextAuthMiddleware as any)(request);
    
    if (session && session.auth?.user) {
      const user = session.auth.user;
      requestHeaders.set("x-user-id", user.id || "");
      requestHeaders.set("x-user-email", user.email || "");
      requestHeaders.set("x-user-role", (user as any).role || "USER");

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // Let API routes pass through with stripped headers.
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 2. Web Page Protection (NextAuth edge validation)
  return (nextAuthMiddleware as any)(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
