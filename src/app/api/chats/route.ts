import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const chatCreateSchema = z.object({
  characterId: z.string().min(1, "Character ID is required")
});

export const dynamic = "force-dynamic";

// GET /api/chats: Retrieve all active chats for the authenticated user
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const chats = await db.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        character: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            avatarType: true,
            avatarValue: true,
            avatarColor: true,
            category: true,
            tone: true,
          }
        },
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return NextResponse.json({ chats });
  } catch (error: any) {
    console.error("GET /api/chats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

// POST /api/chats: Initialize a new chat thread matching a characterId
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = chatCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { characterId } = result.data;

    // Verify character exists and is visible to the user (either public or created by the user)
    const character = await db.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    if (character.visibility === "private" && character.createdBy !== userId) {
      return NextResponse.json({ error: "Unauthorized access to private character" }, { status: 403 });
    }

    // Initialize new Chat record, saving a snapshot of the current system prompt
    const chat = await db.chat.create({
      data: {
        userId,
        characterId,
        title: character.name,
        systemPromptSnapshot: character.systemPrompt
      },
      include: {
        character: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            avatarType: true,
            avatarValue: true,
            avatarColor: true,
            category: true,
            tone: true,
          }
        },
        messages: true
      }
    });

    // Transactionally increment usageCount on character
    await db.character.update({
      where: { id: characterId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize chat thread" },
      { status: 500 }
    );
  }
}
