import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

async function getRewardAndVerify(rewardId: string, businessId: string) {
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    include: { program: true },
  });
  if (!reward || reward.program.businessId !== businessId) return null;
  return reward;
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  pointsRequired: z.number().int().positive().optional(),
  rewardType: z.enum(["discount", "freebie", "upgrade"]).optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });

  const { rewardId } = await params;
  const reward = await getRewardAndVerify(rewardId, session.user.businessId);
  if (!reward) return NextResponse.json<ApiResponse>({ success: false, error: "Recompensa no encontrada" }, { status: 404 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const updated = await prisma.reward.update({ where: { id: rewardId }, data });
    return NextResponse.json<ApiResponse>({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ rewardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });

  const { rewardId } = await params;
  const reward = await getRewardAndVerify(rewardId, session.user.businessId);
  if (!reward) return NextResponse.json<ApiResponse>({ success: false, error: "Recompensa no encontrada" }, { status: 404 });

  await prisma.reward.update({ where: { id: rewardId }, data: { isActive: false } });
  return NextResponse.json<ApiResponse>({ success: true, data: null });
}
