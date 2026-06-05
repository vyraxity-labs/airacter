import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type Params = Promise<{ id: string }>;

export async function POST(
  request: Request,
  { params }: { params: Params }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: characterId } = await params;

    // Verify character exists
    const character = await db.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    try {
      await db.$transaction([
        db.characterSave.create({
          data: {
            userId,
            characterId
          }
        }),
        db.character.update({
          where: { id: characterId },
          data: {
            saveCount: { increment: 1 }
          }
        })
      ]);
    } catch (e: any) {
      // Prisma unique constraint error code (P2002)
      if (e.code === "P2002") {
        return NextResponse.json({ success: true, saved: true, message: "Already saved" });
      }
      throw e;
    }

    return NextResponse.json({ success: true, saved: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save character" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: characterId } = await params;

    try {
      await db.$transaction([
        db.characterSave.delete({
          where: {
            userId_characterId: {
              userId,
              characterId
            }
          }
        }),
        db.character.update({
          where: { id: characterId },
          data: {
            saveCount: { decrement: 1 }
          }
        })
      ]);
    } catch (e: any) {
      // Prisma record not found error code (P2025)
      if (e.code === "P2025") {
        return NextResponse.json({ success: true, saved: false, message: "Not saved previously" });
      }
      throw e;
    }

    return NextResponse.json({ success: true, saved: false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to unsave character" }, { status: 500 });
  }
}
