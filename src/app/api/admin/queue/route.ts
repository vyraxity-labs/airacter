import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  const userRole = request.headers.get("x-user-role");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
  }

  try {
    // 1. Fetch unverified public characters (pending review)
    const pendingCharacters = await db.character.findMany({
      where: {
        visibility: "public",
        isVerified: false,
      },
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 2. Fetch pending reports
    const reportedCharacters = await db.characterReport.findMany({
      where: {
        status: "pending",
      },
      orderBy: { createdAt: "desc" },
      include: {
        character: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      pendingCharacters,
      reportedCharacters,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin queue" },
      { status: 500 }
    );
  }
}
