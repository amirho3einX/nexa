import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
try {
const body = await request.json();


const email = String(body.email || "").trim().toLowerCase();
const password = String(body.password || "");

if (!email || !password) {
  return NextResponse.json(
    { error: "Email and password are required" },
    { status: 400 }
  );
}

const user = await prisma.user.findUnique({
  where: {
    email,
  },
});

if (!user) {
  return NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );
}

const passwordMatches = await bcrypt.compare(
  password,
  user.password
);

if (!passwordMatches) {
  return NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );
}

const token = await createToken(user.id);

const response = NextResponse.json({
  message: "Login successful",
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
});

response.cookies.set("auth_token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
});

return response;


} catch (error) {
console.error("POST /api/auth/login error:", error);

return NextResponse.json(
  { error: "Failed to login" },
  { status: 500 }
);


}
}
