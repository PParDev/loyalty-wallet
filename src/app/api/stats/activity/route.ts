import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    where: {
      card: { program: { businessId: session.user.businessId } },
    },
    include: {
      card: { include: { customer: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const activity = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    points: t.points,
    customerName: t.card.customer.name,
    description: t.description,
    createdAt: t.createdAt,
  }));

  return NextResponse.json<ApiResponse>({ success: true, data: activity });
}
