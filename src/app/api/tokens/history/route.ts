import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "10";

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  try {
    const [transactions, total] = await Promise.all([
      db.tokenTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      db.tokenTransaction.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return NextResponse.json({
      transactions,
      page: pageNum,
      totalPages,
      total,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve transaction history" },
      { status: 500 }
    );
  }
}
