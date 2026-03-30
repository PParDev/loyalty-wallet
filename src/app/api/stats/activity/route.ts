import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const where = { card: { program: { businessId: session.user.businessId } } };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { card: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const activity = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    points: t.points,
    customerName: t.card.customer.name,
    description: t.description,
    createdAt: t.createdAt,
  }));

  return NextResponse.json<ApiResponse>({ success: true, data: { activity, total, page, limit } });
}
