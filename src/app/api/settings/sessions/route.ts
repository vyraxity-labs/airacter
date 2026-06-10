import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function parseUserAgent(userAgent: string) {
  let os = "Unknown OS";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Macintosh") || userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("Linux")) os = "Linux";

  let browser = "Unknown Browser";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Trident") || userAgent.includes("MSIE")) browser = "Internet Explorer";

  return { os, browser };
}

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get current connection details
    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const { os, browser } = parseUserAgent(userAgent);

    // 2. Fetch DB sessions
    let dbSessions = await db.session.findMany({
      where: { userId },
      orderBy: { expires: "desc" },
    });

    // 3. Extract the active NextAuth cookie value to detect the current session
    const cookieStore = await cookies();
    const cookieNames = [
      "__Secure-authjs.session-token",
      "authjs.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.session-token",
    ];
    let activeSessionToken = "";
    for (const name of cookieNames) {
      const cookie = cookieStore.get(name);
      if (cookie) {
        activeSessionToken = cookie.value;
        break;
      }
    }

    // 4. Seed mock sessions if the DB is completely empty, so the user can test revocation
    if (dbSessions.length === 0) {
      // Create a mock macOS session
      const mockMacToken = `session::Chrome on macOS::198.51.100.42::mock_mac_${userId}`;
      // Create a mock iOS session
      const mockIosToken = `session::Safari on iOS::203.0.113.88::mock_ios_${userId}`;

      await db.session.createMany({
        data: [
          {
            userId,
            sessionToken: mockMacToken,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
          {
            userId,
            sessionToken: mockIosToken,
            expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          },
        ],
      });

      // Refetch
      dbSessions = await db.session.findMany({
        where: { userId },
        orderBy: { expires: "desc" },
      });
    }

    // 5. Format session objects
    const sessions = dbSessions.map((session) => {
      let device = "Browser Session";
      let ipAddress = "Unknown IP";
      let isCurrent = false;

      if (session.sessionToken.startsWith("session::")) {
        const parts = session.sessionToken.split("::");
        device = parts[1] || device;
        ipAddress = parts[2] || ipAddress;
      } else {
        // NextAuth database session or other token format
        device = `${browser} on ${os}`;
        ipAddress = ip;
      }

      // Check if this session matches the current web session token
      if (activeSessionToken && session.sessionToken === activeSessionToken) {
        isCurrent = true;
      }

      return {
        id: session.id,
        device,
        ipAddress,
        lastActive: session.expires.toISOString(), // Use expires or a relative time estimation
        isCurrent,
      };
    });

    // Make sure we have at least one session marked as "current" (the current browser request)
    const hasCurrent = sessions.some((s) => s.isCurrent);
    if (!hasCurrent) {
      sessions.unshift({
        id: "current-session-context",
        device: `${browser} on ${os}`,
        ipAddress: ip,
        lastActive: new Date().toISOString(),
        isCurrent: true,
      });
    }

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch active sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find active cookie token
    const cookieStore = await cookies();
    const cookieNames = [
      "__Secure-authjs.session-token",
      "authjs.session-token",
      "__Secure-next-auth.session-token",
      "next-auth.session-token",
    ];
    let activeSessionToken = "";
    for (const name of cookieNames) {
      const cookie = cookieStore.get(name);
      if (cookie) {
        activeSessionToken = cookie.value;
        break;
      }
    }

    // Delete all sessions for the user EXCEPT the active one
    if (activeSessionToken) {
      await db.session.deleteMany({
        where: {
          userId,
          sessionToken: {
            not: activeSessionToken,
          },
        },
      });
    } else {
      // If no active session token cookie found (e.g. API request via mobile Bearer token),
      // we can clear all sessions
      await db.session.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clear other sessions" },
      { status: 500 }
    );
  }
}
