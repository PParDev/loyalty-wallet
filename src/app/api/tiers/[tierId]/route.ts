import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tierId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });

  const { tierId } = await params;

  const tier = await prisma.tier.findUnique({
    where: { id: tierId },
    include: { program: true },
  });

  if (!tier) return NextResponse.json<ApiResponse>({ success: false, error: "Nivel no encontrado" }, { status: 404 });
  if (tier.program.businessId !== session.user.businessId) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });
  }

  await prisma.tier.delete({ where: { id: tierId } });
  return NextResponse.json<ApiResponse>({ success: true, data: null });
}
