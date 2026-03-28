import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function verifyToken(token: string): boolean {
  try {
    const secret = process.env.NEXTAUTH_SECRET!;
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length < 4) return false;
    const sig = parts.pop()!;
    const payload = parts.join(":");
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    return sig === expected;
  } catch {
    return false;
  }
}

export async function verifyAdminToken(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  return verifyToken(token);
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
}
