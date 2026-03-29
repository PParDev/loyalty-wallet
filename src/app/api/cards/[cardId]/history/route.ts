import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

// Endpoint público — el cliente ve su propio historial desde /card/{cardId}
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const card = await prisma.loyaltyCard.findUnique({
    where: { id: cardId },
    include: { program: { include: { business: true } } },
  });

  if (!card) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta no encontrada" }, { status: 404 });
  }

  if (!card.program.business.isActive) {
    return NextResponse.json<ApiResponse>({ success: false, error: "SUSPENDED" }, { status: 403 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { cardId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      points: true,
      amountSpent: true,
      description: true,
      createdAt: true,
    },
  });

  return NextResponse.json<ApiResponse>({ success: true, data: transactions });
}
