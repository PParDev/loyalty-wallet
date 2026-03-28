import { NextResponse } from "next/server";
import { z } from "zod";
import { createHmac, randomBytes } from "crypto";

const schema = z.object({ email: z.string().email(), password: z.string() });

function makeToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET!;
  const payload = `${email}:superadmin:${Date.now()}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ success: false, error: "Admin no configurado en el servidor" }, { status: 500 });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ success: false, error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = makeToken(email);
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return res;
}
