import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const CategoryEnum = z.enum([
  "education",
  "productivity",
  "entertainment",
  "wellness",
  "creative",
  "technical",
  "fun",
  "other"
]);

const VisibilityEnum = z.enum(["private", "public"]);
const AvatarTypeEnum = z.enum(["emoji", "initials", "image"]);

const characterUpdateSchema = z.object({
  name: z.string().min(3).max(60).optional(),
  description: z.string().max(200).optional(),
  systemPrompt: z.string().min(20).max(2000).optional(),
  avatarType: AvatarTypeEnum.optional(),
  avatarValue: z.string().min(1).optional(),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  category: CategoryEnum.optional(),
  tone: z.array(z.string()).min(1).max(4).optional(),
  visibility: VisibilityEnum.optional()
});

type Params = Promise<{ id: string }>;

export async function PUT(
  request: Request,
  { params }: { params: Params }
) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const result = characterUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    // Find character
    const existing = await db.character.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    if (existing.createdBy !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not the creator of this character" }, { status: 403 });
    }

    const updated = await db.character.update({
      where: { id },
      data: result.data,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ character: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update character" }, { status: 500 });
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
    const { id } = await params;

    // Find character
    const existing = await db.character.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    if (existing.createdBy !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not the creator of this character" }, { status: 403 });
    }

    await db.character.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete character" }, { status: 500 });
  }
}
