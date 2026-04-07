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
        include: {
          business: true,
          tiers: { orderBy: { minPoints: "asc" } },
        },
      },
    },
  });

  if (!card) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta no encontrada" }, { status: 404 });
  }

  if (!card.program.business.isActive) {
    return NextResponse.json<ApiResponse>({ success: false, error: "SUSPENDED" }, { status: 403 });
  }

  const activeTier = [...card.program.tiers]
    .sort((a, b) => b.minPoints - a.minPoints)
    .find((t) => t.minPoints <= card.totalPointsEarned) ?? null;

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      cardId: card.id,
      customerName: card.customer.name,
      currentPoints: card.currentPoints,
      totalPointsEarned: card.totalPointsEarned,
      totalVisits: card.totalVisits,
      pointsExpiresAt: card.pointsExpiresAt,
      qrCodeData: card.qrCodeData,
      program: {
        name: card.program.name,
        earningMode: card.program.earningMode,
        cardBgColor: card.program.cardBgColor,
        cardTextColor: card.program.cardTextColor,
        pointsPerVisit: card.program.pointsPerVisit,
        pointsExpirationDays: card.program.pointsExpirationDays,
        stampsRequired: card.program.stampsRequired,
      },
      business: {
        name: card.program.business.name,
        logoUrl: card.program.business.logoUrl,
        isWhiteLabel: (card.program.business as any).isWhiteLabel,
      },
      tier: activeTier,
    },
  });
}
