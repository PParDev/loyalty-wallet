import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, BusinessPublicInfo } from "@/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug, isActive: true },
    include: {
      loyaltyPrograms: {
        where: { isActive: true },
        take: 1,
        select: {
          id: true,
          name: true,
          pointsPerVisit: true,
          pointsPerCurrency: true,
          cardBgColor: true,
          cardTextColor: true,
        },
      },
    },
  });

  if (!business) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Negocio no encontrado" }, { status: 404 });
  }

  const result: BusinessPublicInfo = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    category: business.category,
    description: business.description,
    logoUrl: business.logoUrl,
    program: business.loyaltyPrograms[0] ?? null,
  };

  return NextResponse.json<ApiResponse<BusinessPublicInfo>>({ success: true, data: result });
}
