import { NextResponse } from "next/server";
import { z } from "zod";

const checkoutSchema = z.object({
  packId: z.enum(["lite", "standard", "pro"]),
});

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid package selection" },
        { status: 400 }
      );
    }

    const { packId } = result.data;

    return NextResponse.json({
      success: true,
      checkoutUrl: `/upgrade/checkout?packId=${packId}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to initiate checkout" },
      { status: 500 }
    );
  }
}
