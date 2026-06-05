import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

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

const characterCreateSchema = z.object({
  name: z.string().min(3).max(60),
  description: z.string().max(200),
  systemPrompt: z.string().min(20).max(2000),
  avatarType: AvatarTypeEnum.default("emoji"),
  avatarValue: z.string().min(1),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0ea5e9"),
  category: CategoryEnum.default("other"),
  tone: z.array(z.string()).min(1).max(4),
  visibility: VisibilityEnum.default("private")
});

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/[^\w\-]+/g, "")       // Remove all non-word chars
    .replace(/\-\-+/g, "-")         // Replace multiple - with single -
    .replace(/^-+/, "")             // Trim - from start of text
    .replace(/-+$/, "");            // Trim - from end of text
}

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "popular";
  const q = searchParams.get("q");
  const scope = searchParams.get("scope");
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "9";

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const where: any = {};

    if (scope === "my") {
      where.createdBy = userId;
    } else if (scope === "saved") {
      const saved = await db.characterSave.findMany({
        where: { userId },
        include: {
          character: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  image: true
                }
              }
            }
          }
        },
        orderBy: { savedAt: "desc" },
        skip,
        take: limitNum
      });

      const totalSaves = await db.characterSave.count({ where: { userId } });
      const totalPages = Math.ceil(totalSaves / limitNum);

      return NextResponse.json({
        characters: saved.map(s => s.character),
        page: pageNum,
        totalPages
      });
    } else {
      where.visibility = "public";
    }

    if (category) {
      where.category = category;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      ];
    }

    const orderBy: any = {};
    if (sort === "new") {
      orderBy.createdAt = "desc";
    } else {
      orderBy.usageCount = "desc";
    }

    const [characters, total] = await Promise.all([
      db.character.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      }),
      db.character.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return NextResponse.json({
      characters,
      page: pageNum,
      totalPages
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch characters" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = characterCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const { name, description, systemPrompt, avatarType, avatarValue, avatarColor, category, tone, visibility } = result.data;

    const baseSlug = slugify(name) || "character";
    const uniqueSuffix = crypto.randomBytes(4).toString("hex");
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const character = await db.character.create({
      data: {
        slug,
        name,
        description,
        systemPrompt,
        avatarType,
        avatarValue,
        avatarColor,
        category,
        tone,
        visibility,
        createdBy: userId
      },
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

    return NextResponse.json({ character }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create character" }, { status: 500 });
  }
}
