import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    emailValue: process.env.ADMIN_EMAIL ? `${process.env.ADMIN_EMAIL.slice(0, 3)}...` : "NO CONFIGURADO",
  });
}
