import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev_secret_jwt_123456789_airacter_mobile_rest"
);

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
