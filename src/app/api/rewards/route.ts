import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const program = await prisma.loyaltyProgram.findFirst({
    where: { businessId: session.user.businessId, isActive: true },
  });

  if (!program) return NextResponse.json<ApiResponse>({ success: true, data: [] });

  const rewards = await prisma.reward.findMany({
    where: { programId: program.id },
    orderBy: { pointsRequired: "asc" },
  });

  return NextResponse.json<ApiResponse>({ success: true, data: rewards });
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  pointsRequired: z.number().int().positive(),
  rewardType: z.enum(["discount", "freebie", "upgrade"]),
  maxRedemptions: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const program = await prisma.loyaltyProgram.findFirst({
      where: { businessId: session.user.businessId, isActive: true },
    });

    if (!program) return NextResponse.json<ApiResponse>({ success: false, error: "Programa no encontrado" }, { status: 404 });

    const reward = await prisma.reward.create({
      data: { programId: program.id, ...data },
    });

    return NextResponse.json<ApiResponse>({ success: true, data: reward }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}
