import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

const createSchema = z.object({
  name: z.string().min(1).max(50),
  minPoints: z.number().int().min(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#CD7F32"),
  benefits: z.string().max(200).optional(),
  multiplier: z.number().min(1.0).max(5.0).default(1.0),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const program = await prisma.loyaltyProgram.findFirst({
    where: { businessId: session.user.businessId, isActive: true },
  });
  if (!program) return NextResponse.json<ApiResponse>({ success: false, error: "Programa no encontrado" }, { status: 404 });

  const tiers = await prisma.tier.findMany({
    where: { programId: program.id },
    orderBy: { minPoints: "asc" },
  });

  return NextResponse.json<ApiResponse>({ success: true, data: tiers });
}

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

    // Máximo 5 niveles
    const count = await prisma.tier.count({ where: { programId: program.id } });
    if (count >= 5) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Máximo 5 niveles permitidos" }, { status: 400 });
    }

    const tier = await prisma.tier.create({
      data: { ...data, programId: program.id },
    });

    return NextResponse.json<ApiResponse>({ success: true, data: tier });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}
