import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET(_req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params;

  const card = await prisma.loyaltyCard.findUnique({
    where: { id: cardId },
    include: {
      customer: true,
      program: {
        include: { business: true },
      },
    },
  });

  if (!card) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta no encontrada" }, { status: 404 });
  }

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      cardId: card.id,
      customerName: card.customer.name,
      currentPoints: card.currentPoints,
      totalVisits: card.totalVisits,
      qrCodeData: card.qrCodeData,
      program: {
        name: card.program.name,
        cardBgColor: card.program.cardBgColor,
        cardTextColor: card.program.cardTextColor,
        pointsPerVisit: card.program.pointsPerVisit,
      },
      business: {
        name: card.program.business.name,
        logoUrl: card.program.business.logoUrl,
      },
    },
  });
}
