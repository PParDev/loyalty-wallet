import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";

  const program = await prisma.loyaltyProgram.findFirst({
    where: { businessId: session.user.businessId, isActive: true },
  });

  if (!program) return NextResponse.json<ApiResponse>({ success: true, data: { customers: [], total: 0 } });

  const where = search
    ? {
        programId: program.id,
        customer: {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        },
      }
    : { programId: program.id };

  const [cards, total] = await Promise.all([
    prisma.loyaltyCard.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loyaltyCard.count({ where }),
  ]);

  const customers = cards.map((card) => ({
    id: card.customer.id,
    name: card.customer.name,
    phone: card.customer.phone,
    email: card.customer.email,
    currentPoints: card.currentPoints,
    totalVisits: card.totalVisits,
    lastVisit: card.lastVisit,
    cardId: card.id,
    createdAt: card.createdAt,
  }));

  return NextResponse.json<ApiResponse>({ success: true, data: { customers, total, page, limit } });
}
