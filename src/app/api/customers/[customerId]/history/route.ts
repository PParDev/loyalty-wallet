import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const { customerId } = await params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  // Verify the card belongs to this business
  const card = await prisma.loyaltyCard.findFirst({
    where: {
      customerId,
      program: { businessId: session.user.businessId },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
    },
  });

  if (!card) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Cliente no encontrado" }, { status: 404 });
  }

  const where = { cardId: card.id };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      customer: card.customer,
      card: {
        id: card.id,
        currentPoints: card.currentPoints,
        totalPointsEarned: card.totalPointsEarned,
        totalVisits: card.totalVisits,
        lastVisit: card.lastVisit,
        createdAt: card.createdAt,
      },
      transactions,
      total,
      page,
      limit,
    },
  });
}
