import { SignJWT, jwtVerify } from "jose";

const secret = process.env.AUTH_SECRET;

if (!secret) {
throw new Error("AUTH_SECRET is not defined in environment variables");
}

const secretKey = new TextEncoder().encode(secret);

export async function createToken(userId: number): Promise<string> {
return new SignJWT({ userId })
.setProtectedHeader({ alg: "HS256" })
.setIssuedAt()
.setExpirationTime("7d")
.sign(secretKey);
}

export async function verifyToken(
token: string
): Promise<{ userId: number } | null> {
try {
const { payload } = await jwtVerify(token, secretKey);


if (typeof payload.userId !== "number") {
  return null;
}

return {
  userId: payload.userId,
};


} catch {
return null;
}
}
