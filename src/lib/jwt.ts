import { SignJWT, jwtVerify } from "jose";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE?.includes("build")) {
      throw new Error("JWT_SECRET environment variable is missing in production.");
    }
    return new TextEncoder().encode("dev_secret_jwt_123456789_airacter_mobile_rest");
  }
  return new TextEncoder().encode(secret);
};

const JWT_SECRET = getJwtSecret();

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Signs a JWT payload for mobile authentication.
 * Defaults to 30 days expiry.
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT token and returns the payload.
 * Returns null if verification fails.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}
