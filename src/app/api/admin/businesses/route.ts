import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET() {
  if (!(await verifyAdminToken())) return unauthorizedResponse();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { where: { role: "admin" }, take: 1 },
      loyaltyPrograms: {
        where: { isActive: true },
        take: 1,
        include: {
          _count: { select: { loyaltyCards: true } },
        },
      },
    },
  });

  const data = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    category: b.category,
    isActive: b.isActive,
    createdAt: b.createdAt,
    ownerEmail: b.users[0]?.email ?? null,
    ownerName: b.users[0]?.name ?? null,
    totalCards: b.loyaltyPrograms[0]?._count.loyaltyCards ?? 0,
  }));

  return NextResponse.json({ success: true, data });
}
