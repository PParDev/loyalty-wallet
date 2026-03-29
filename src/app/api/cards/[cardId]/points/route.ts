import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

const schema = z.object({
  points: z.number().int().positive().optional(),
  amountSpent: z.number().positive().optional(),
  description: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const { cardId } = await params;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const card = await prisma.loyaltyCard.findUnique({
      where: { id: cardId },
      include: {
        program: {
          include: {
            business: true,
            tiers: { orderBy: { minPoints: "desc" } },
          },
        },
      },
    });

    if (!card) return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta no encontrada" }, { status: 404 });
    if (card.program.businessId !== session.user.businessId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });
    }
    if (!card.program.business.isActive) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Negocio suspendido" }, { status: 403 });
    }

    const now = new Date();
    let pointsExpired = false;

    // 1. Expirar puntos si aplica
    if (
      card.program.pointsExpirationDays &&
      card.pointsExpiresAt &&
      card.pointsExpiresAt < now &&
      card.currentPoints > 0
    ) {
      await prisma.$transaction([
        prisma.loyaltyCard.update({ where: { id: cardId }, data: { currentPoints: 0 } }),
        prisma.transaction.create({
          data: {
            cardId,
            type: "adjust",
            points: -card.currentPoints,
            description: "Puntos vencidos por inactividad",
            createdById: session.user.id,
          },
        }),
      ]);
      pointsExpired = true;
    }

    // 2. Calcular puntos a sumar
    let base: number;
    if (card.program.earningMode === "amount" && data.amountSpent && card.program.pointsPerCurrency > 0) {
      base = data.amountSpent * card.program.pointsPerCurrency;
    } else {
      base = data.points ?? card.program.pointsPerVisit;
    }
    // Multiplicador de tier (basado en totalPointsEarned histórico)
    const activeTier = card.program.tiers.find((t) => t.minPoints <= card.totalPointsEarned);
    const multiplier = activeTier?.multiplier ?? 1.0;
    const pointsToAdd = Math.round(base * multiplier);

    // 3. Nueva fecha de expiración (se renueva con cada actividad)
    const newExpiresAt = card.program.pointsExpirationDays
      ? new Date(now.getTime() + card.program.pointsExpirationDays * 24 * 60 * 60 * 1000)
      : null;

    // 4. Actualizar tarjeta + crear transacción
    const [updatedCard] = await prisma.$transaction([
      prisma.loyaltyCard.update({
        where: { id: cardId },
        data: {
          currentPoints: { increment: pointsToAdd },
          totalPointsEarned: { increment: pointsToAdd },
          totalVisits: { increment: 1 },
          lastVisit: now,
          pointsExpiresAt: newExpiresAt,
        },
      }),
      prisma.transaction.create({
        data: {
          cardId,
          type: "earn",
          points: pointsToAdd,
          amountSpent: data.amountSpent,
          description: data.description ?? `+${pointsToAdd} puntos`,
          createdById: session.user.id,
        },
      }),
    ]);

    void updateWalletInBackground(cardId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        newPoints: updatedCard.currentPoints,
        pointsAdded: pointsToAdd,
        pointsExpired,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}

async function updateWalletInBackground(cardId: string) {
  try {
    const { updateCardPoints } = await import("@/lib/google-wallet");
    await updateCardPoints(cardId);
  } catch {
    // No interrumpir si falla la actualización del wallet
  }
}
