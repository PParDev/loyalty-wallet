import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, DashboardStats } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const program = await prisma.loyaltyProgram.findFirst({
    where: { businessId: session.user.businessId, isActive: true },
  });

  if (!program) {
    return NextResponse.json<ApiResponse<DashboardStats>>({
      success: true,
      data: { totalCustomers: 0, visitsToday: 0, pointsRedeemedThisMonth: 0, activeCards: 0 },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [totalCustomers, visitsToday, pointsRedeemedResult, activeCards] = await Promise.all([
    prisma.loyaltyCard.count({ where: { programId: program.id } }),
    prisma.transaction.count({
      where: {
        type: "earn",
        createdAt: { gte: today },
        card: { programId: program.id },
      },
    }),
    prisma.transaction.aggregate({
      where: {
        type: "redeem",
        createdAt: { gte: firstOfMonth },
        card: { programId: program.id },
      },
      _sum: { points: true },
    }),
    prisma.loyaltyCard.count({
      where: { programId: program.id, lastVisit: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const stats: DashboardStats = {
    totalCustomers,
    visitsToday,
    pointsRedeemedThisMonth: Math.abs(pointsRedeemedResult._sum.points ?? 0),
    activeCards,
  };

  return NextResponse.json<ApiResponse<DashboardStats>>({ success: true, data: stats });
}
