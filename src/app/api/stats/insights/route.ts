import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const program = await prisma.loyaltyProgram.findFirst({
    where: { businessId: session.user.businessId, isActive: true },
  });

  if (!program) {
    return NextResponse.json<ApiResponse>({ success: true, data: { insights: [] } });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    atRiskCustomers,
    lostCustomers,
    newThisWeek,
    newLastWeek,
    topCustomers,
    totalEarned,
    totalRedeemed,
    recentTransactions,
  ] = await Promise.all([
    // Clientes en riesgo: última visita entre 30 y 60 días
    prisma.loyaltyCard.count({
      where: { programId: program.id, lastVisit: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    // Clientes perdidos: >60 días sin visitar
    prisma.loyaltyCard.count({
      where: { programId: program.id, lastVisit: { lt: sixtyDaysAgo } },
    }),
    // Nuevos clientes esta semana
    prisma.loyaltyCard.count({
      where: { programId: program.id, createdAt: { gte: sevenDaysAgo } },
    }),
    // Nuevos clientes semana pasada
    prisma.loyaltyCard.count({
      where: { programId: program.id, createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    // Top 5 clientes
    prisma.loyaltyCard.findMany({
      where: { programId: program.id },
      orderBy: { totalPointsEarned: "desc" },
      take: 5,
      include: { customer: { select: { name: true, phone: true } } },
    }),
    // Total puntos ganados
    prisma.transaction.aggregate({
      where: { card: { programId: program.id }, type: "earn" },
      _sum: { points: true },
    }),
    // Total puntos canjeados
    prisma.transaction.aggregate({
      where: { card: { programId: program.id }, type: "redeem" },
      _sum: { points: true },
    }),
    // Transacciones recientes para calcular día/hora pico
    prisma.transaction.findMany({
      where: { card: { programId: program.id }, type: "earn", createdAt: { gte: sixtyDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Calcular día pico
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Dom-Sáb
  const hourCounts = new Array(24).fill(0);
  for (const tx of recentTransactions) {
    dayCounts[tx.createdAt.getDay()]++;
    hourCounts[tx.createdAt.getHours()]++;
  }
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const peakDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Tasa de canje
  const earned = totalEarned._sum.points ?? 0;
  const redeemed = Math.abs(totalRedeemed._sum.points ?? 0);
  const redeemRate = earned > 0 ? Math.round((redeemed / earned) * 100) : 0;

  // Crecimiento semana
  const growth = newLastWeek > 0
    ? Math.round(((newThisWeek - newLastWeek) / newLastWeek) * 100)
    : newThisWeek > 0 ? 100 : 0;

  // Construir insights como cards
  type Insight = { id: string; type: "warning" | "success" | "info" | "danger"; icon: string; title: string; description: string; value?: string };
  const insights: Insight[] = [];

  if (atRiskCustomers > 0) {
    insights.push({
      id: "at-risk",
      type: "warning",
      icon: "⚠️",
      title: `${atRiskCustomers} cliente${atRiskCustomers > 1 ? "s" : ""} en riesgo`,
      description: "No han vuelto en 30+ días. Envía una notificación para recuperarlos.",
      value: String(atRiskCustomers),
    });
  }

  if (lostCustomers > 0) {
    insights.push({
      id: "lost",
      type: "danger",
      icon: "🔴",
      title: `${lostCustomers} cliente${lostCustomers > 1 ? "s" : ""} perdido${lostCustomers > 1 ? "s" : ""}`,
      description: "Sin visitar en 60+ días.",
      value: String(lostCustomers),
    });
  }

  insights.push({
    id: "growth",
    type: growth >= 0 ? "success" : "warning",
    icon: growth >= 0 ? "📈" : "📉",
    title: `${newThisWeek} nuevo${newThisWeek !== 1 ? "s" : ""} esta semana`,
    description: growth !== 0 ? `${growth > 0 ? "+" : ""}${growth}% vs semana pasada` : "Igual que la semana pasada",
    value: `${growth > 0 ? "+" : ""}${growth}%`,
  });

  if (recentTransactions.length > 10) {
    insights.push({
      id: "peak-day",
      type: "info",
      icon: "📊",
      title: `Tu mejor día es ${dayNames[peakDayIndex]}`,
      description: `Con ${dayCounts[peakDayIndex]} visitas. Hora pico: ${peakHour}:00–${peakHour + 1}:00.`,
    });
  }

  if (topCustomers.length > 0) {
    const best = topCustomers[0];
    insights.push({
      id: "top-customer",
      type: "success",
      icon: "⭐",
      title: `${best.customer.name} es tu cliente más leal`,
      description: `${best.totalVisits} visitas, ${Math.floor(best.totalPointsEarned)} puntos acumulados.`,
    });
  }

  if (redeemRate > 0) {
    insights.push({
      id: "redeem-rate",
      type: "info",
      icon: "🎁",
      title: `Tasa de canje: ${redeemRate}%`,
      description: `De los puntos acumulados, el ${redeemRate}% se ha canjeado.`,
    });
  }

  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      insights,
      topCustomers: topCustomers.map((c) => ({
        name: c.customer.name,
        phone: c.customer.phone,
        visits: c.totalVisits,
        points: Math.floor(c.totalPointsEarned),
      })),
    },
  });
}
