import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, unauthorizedResponse } from "@/lib/admin-auth";
import { z } from "zod";

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdminToken())) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
  }

  const business = await prisma.business.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
  });

  return NextResponse.json({ success: true, data: { id: business.id, isActive: business.isActive } });
}
