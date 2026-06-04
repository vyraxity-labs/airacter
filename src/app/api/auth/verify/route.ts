import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    // Look up verification token
    const tokenRecord = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid verification token or token has already been used." },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > tokenRecord.expires) {
      // Clean up expired token
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new registration." },
        { status: 400 }
      );
    }

    const email = tokenRecord.identifier;

    // Verify user and award welcome tokens in a single transaction
    await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { email },
        data: {
          emailVerified: new Date(),
        },
      });

      // Credit welcome tokens (50,000 tokens signup bonus)
      await tx.tokenTransaction.create({
        data: {
          userId: user.id,
          type: "credit_welcome",
          direction: "credit",
          amount: 50000,
          metadata: {
            reason: "Welcome signup bonus",
          },
        },
      });

      // Clean up spent token
      await tx.verificationToken.delete({
        where: { token },
      });
    });

    return NextResponse.json(
      { message: "Email verified successfully. 50,000 welcome tokens have been credited to your balance." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Verification API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during email verification." },
      { status: 500 }
    );
  }
}
