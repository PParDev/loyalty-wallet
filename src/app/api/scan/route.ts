import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseQrData } from "@/lib/qr";
import type { ApiResponse, CardScanResult } from "@/types";

const schema = z.object({ qrCodeData: z.string() });

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone")?.trim().replace(/\s/g, "");
  if (!phone) return NextResponse.json<ApiResponse>({ success: false, error: "Teléfono requerido" }, { status: 400 });

  const card = await prisma.loyaltyCard.findFirst({
    where: {
      customer: { phone },
      program: { businessId: session.user.businessId, isActive: true },
    },
    include: {
      customer: true,
      program: {
        include: {
          business: true,
          rewards: { where: { isActive: true }, orderBy: { pointsRequired: "asc" } },
        },
      },
    },
  });

  if (!card) return NextResponse.json<ApiResponse>({ success: false, error: "Cliente no encontrado" }, { status: 404 });

  if (!card.program.business.isActive) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Este negocio está suspendido" }, { status: 403 });
  }

  const availableRewards = card.program.rewards.filter((r) => r.pointsRequired <= card.currentPoints);

  const result: CardScanResult = {
    cardId: card.id,
    customer: { id: card.customer.id, name: card.customer.name, phone: card.customer.phone },
    currentPoints: card.currentPoints,
    totalVisits: card.totalVisits,
    lastVisit: card.lastVisit,
    availableRewards: availableRewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      pointsRequired: r.pointsRequired,
      rewardType: r.rewardType,
    })),
    program: {
      name: card.program.name,
      pointsPerVisit: card.program.pointsPerVisit,
      pointsPerCurrency: card.program.pointsPerCurrency,
    },
  };

  return NextResponse.json<ApiResponse<CardScanResult>>({ success: true, data: result });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { qrCodeData } = schema.parse(body);

    if (!parseQrData(qrCodeData)) {
      return NextResponse.json<ApiResponse>({ success: false, error: "QR inválido" }, { status: 400 });
    }

    const card = await prisma.loyaltyCard.findUnique({
      where: { qrCodeData },
      include: {
        customer: true,
        program: {
          include: {
            business: true,
            rewards: { where: { isActive: true }, orderBy: { pointsRequired: "asc" } },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta no encontrada" }, { status: 404 });
    }

    if (!card.program.business.isActive) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Este negocio está suspendido" }, { status: 403 });
    }

    // Verificar que la tarjeta pertenece al negocio del cajero
    if (card.program.businessId !== session.user.businessId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta de otro negocio" }, { status: 403 });
    }

    const availableRewards = card.program.rewards.filter(
      (r) => r.pointsRequired <= card.currentPoints
    );

    const result: CardScanResult = {
      cardId: card.id,
      customer: {
        id: card.customer.id,
        name: card.customer.name,
        phone: card.customer.phone,
      },
      currentPoints: card.currentPoints,
      totalVisits: card.totalVisits,
      lastVisit: card.lastVisit,
      availableRewards: availableRewards.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        pointsRequired: r.pointsRequired,
        rewardType: r.rewardType,
      })),
      program: {
        name: card.program.name,
        pointsPerVisit: card.program.pointsPerVisit,
        pointsPerCurrency: card.program.pointsPerCurrency,
      },
    };

    return NextResponse.json<ApiResponse<CardScanResult>>({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}
