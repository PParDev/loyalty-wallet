import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToken, createOrUpdateLoyaltyClass } from "@/lib/google-wallet";
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

const linkSchema = z.object({
  id: z.string(),
  label: z.string().min(1).max(50),
  url: z.string().url(),
});

const updateSchema = z.object({
  // Datos del negocio
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  geoRadiusMeters: z.number().int().min(50).max(5000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  links: z.array(linkSchema).max(5).optional(),
  // Datos del programa de lealtad
  programName: z.string().min(2).optional(),
  cardBgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  cardTextColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  pointsPerVisit: z.number().int().min(1).optional(),
  pointsPerCurrency: z.number().min(0).optional(),
  earningMode: z.enum(["visit", "amount"]).optional(),
  pointsExpirationDays: z.number().int().min(1).nullable().optional(), // null = desactivar expiración
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const { programName, cardBgColor, cardTextColor, pointsPerVisit, pointsPerCurrency, earningMode, pointsExpirationDays, links, ...businessData } = data;

    // Normalizar logoUrl vacío → null
    if ("logoUrl" in businessData && businessData.logoUrl === "") {
      (businessData as Record<string, unknown>).logoUrl = null;
    }

    const business = await prisma.business.update({
      where: { id: session.user.businessId },
      data: {
        ...businessData,
        ...(links !== undefined ? { links: links as object[] } : {}),
      },
    });

    // Actualizar programa si vienen campos del programa
    const programUpdate: Record<string, unknown> = {};
    if (programName) programUpdate.name = programName;
    if (cardBgColor) programUpdate.cardBgColor = cardBgColor;
    if (cardTextColor) programUpdate.cardTextColor = cardTextColor;
    if (pointsPerVisit !== undefined) programUpdate.pointsPerVisit = pointsPerVisit;
    if (pointsPerCurrency !== undefined) programUpdate.pointsPerCurrency = pointsPerCurrency;
    if (earningMode !== undefined) programUpdate.earningMode = earningMode;
    if (pointsExpirationDays !== undefined) programUpdate.pointsExpirationDays = pointsExpirationDays;

    if (Object.keys(programUpdate).length > 0) {
      await prisma.loyaltyProgram.updateMany({
        where: { businessId: session.user.businessId, isActive: true },
        data: programUpdate,
      });
    }

    // Sincronizar clase en Google Wallet (debe completar antes de que Vercel cierre la función)
    try {
      const token = await getToken();
      await createOrUpdateLoyaltyClass(session.user.businessId, token);
    } catch (err) {
      console.error("[settings] Error sincronizando clase GW:", err);
      // No falla el guardado si Google Wallet falla
    }

    return NextResponse.json<ApiResponse>({ success: true, data: business });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}
