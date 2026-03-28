import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

const schema = z.object({ rewardId: z.string().uuid() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const { cardId } = await params;

  try {
    const body = await req.json();
    const { rewardId } = schema.parse(body);

    const [card, reward] = await Promise.all([
      prisma.loyaltyCard.findUnique({ where: { id: cardId }, include: { program: { include: { business: true } } } }),
      prisma.reward.findUnique({ where: { id: rewardId } }),
    ]);

    if (!card) return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta no encontrada" }, { status: 404 });
    if (!reward) return NextResponse.json<ApiResponse>({ success: false, error: "Recompensa no encontrada" }, { status: 404 });
    if (card.program.businessId !== session.user.businessId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });
    }
    if (!card.program.business.isActive) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Negocio suspendido" }, { status: 403 });
    }
    if (!reward.isActive) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Recompensa no disponible" }, { status: 400 });
    }
    if (card.currentPoints < reward.pointsRequired) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Puntos insuficientes" }, { status: 400 });
    }

    // Verificar límite de canjes
    if (reward.maxRedemptions !== null) {
      const count = await prisma.rewardRedemption.count({ where: { rewardId } });
      if (count >= reward.maxRedemptions) {
        return NextResponse.json<ApiResponse>({ success: false, error: "Recompensa agotada" }, { status: 400 });
      }
    }

    const [updatedCard] = await prisma.$transaction([
      prisma.loyaltyCard.update({
        where: { id: cardId },
        data: { currentPoints: { decrement: reward.pointsRequired } },
      }),
      prisma.rewardRedemption.create({
        data: { cardId, rewardId, pointsSpent: reward.pointsRequired, redeemedById: session.user.id },
      }),
      prisma.transaction.create({
        data: {
          cardId,
          type: "redeem",
          points: -reward.pointsRequired,
          description: `Canje: ${reward.name}`,
          createdById: session.user.id,
        },
      }),
    ]);

    void updateWalletInBackground(cardId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { remainingPoints: updatedCard.currentPoints, reward: reward.name },
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
    // No interrumpir si falla
  }
}
