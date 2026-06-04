import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signToken } from "@/lib/jwt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid credentials format." }, { status: 400 });
    }

    const { email, password } = result.data;

    // Fetch user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      // Perform a dummy comparison to mitigate timing attacks / email enumeration
      await bcrypt.compare(password, "$2a$12$Kb9R9b6W6v8u7t6s5r4e3u2i1o0p9a8s7d6f5g4h3j2k1l0z9x8c7");
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Compare passwords
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Verify email confirmation status
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Your email address is not verified. Please check your inbox.", emailVerified: false },
        { status: 403 }
      );
    }

    // Sign bearer JWT token for the mobile client
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        message: "Login successful.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
