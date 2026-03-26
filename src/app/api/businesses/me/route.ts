import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const business = await prisma.business.findFirst({
    where: { users: { some: { id: session.user.id } } },
    include: { loyaltyPrograms: { where: { isActive: true }, take: 1 } },
  });

  if (!business) return NextResponse.json<ApiResponse>({ success: false, error: "Negocio no encontrado" }, { status: 404 });

  return NextResponse.json<ApiResponse>({ success: true, data: business });
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  geoRadiusMeters: z.number().int().min(50).max(5000).optional(),
  logoUrl: z.string().url().optional(),
  category: z.string().optional(),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const business = await prisma.business.update({
      where: { id: session.user.businessId },
      data,
    });

    return NextResponse.json<ApiResponse>({ success: true, data: business });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}
