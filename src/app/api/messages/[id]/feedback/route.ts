import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  feedback: z.enum(["up", "down"]).nullable()
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

// POST /api/messages/[id]/feedback: Update feedback (up/down/null) for a message
export async function POST(request: Request, { params }: RouteParams) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { feedback } = result.data;

    // Retrieve message and verify chat ownership
    const message = await db.message.findUnique({
      where: { id },
      include: {
        chat: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.chat.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized access to this message" }, { status: 403 });
    }

    // Update message feedback
    const updatedMessage = await db.message.update({
      where: { id },
      data: {
        feedback: feedback as any // Mapping "up" | "down" | null to Prisma Feedback type
      }
    });

    return NextResponse.json({
      success: true,
      messageId: updatedMessage.id,
      feedback: updatedMessage.feedback
    });
  } catch (error: any) {
    console.error("POST /api/messages/[id]/feedback error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update feedback" },
      { status: 500 }
    );
  }
}
