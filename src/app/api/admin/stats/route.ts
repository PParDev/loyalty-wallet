import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET() {
  if (!(await verifyAdminToken())) return unauthorizedResponse();

  const [totalBusinesses, activeBusinesses, totalCards, totalCustomers] = await Promise.all([
    prisma.business.count(),
    prisma.business.count({ where: { isActive: true } }),
    prisma.loyaltyCard.count(),
    prisma.customer.count(),
  ]);

  return NextResponse.json({
    success: true,
    data: { totalBusinesses, activeBusinesses, totalCards, totalCustomers },
  });
}
