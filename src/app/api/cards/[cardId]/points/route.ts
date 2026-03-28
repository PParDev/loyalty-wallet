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
      include: { program: { include: { business: true } } },
    });

    if (!card) return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta no encontrada" }, { status: 404 });
    if (card.program.businessId !== session.user.businessId) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });
    }
    if (!card.program.business.isActive) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Negocio suspendido" }, { status: 403 });
    }

    // Calcular puntos a sumar
    let pointsToAdd = data.points ?? card.program.pointsPerVisit;
    if (data.amountSpent && card.program.pointsPerCurrency > 0) {
      pointsToAdd = Math.floor(data.amountSpent * card.program.pointsPerCurrency);
    }

    const [updatedCard] = await prisma.$transaction([
      prisma.loyaltyCard.update({
        where: { id: cardId },
        data: {
          currentPoints: { increment: pointsToAdd },
          totalPointsEarned: { increment: pointsToAdd },
          totalVisits: { increment: 1 },
          lastVisit: new Date(),
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

    // Actualizar wallet en background (no bloquear respuesta)
    void updateWalletInBackground(cardId);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { newPoints: updatedCard.currentPoints, pointsAdded: pointsToAdd },
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
