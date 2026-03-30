import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

const schema = z.object({
  phone: z.string().min(7).max(20),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = schema.parse(body);

    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        loyaltyCards: {
          where: { program: { isActive: true, business: { isActive: true } } },
          include: {
            program: {
              select: {
                name: true,
                cardBgColor: true,
                cardTextColor: true,
                business: {
                  select: { name: true, logoUrl: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer || customer.loyaltyCards.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "No encontramos ninguna tarjeta con ese número" },
        { status: 404 }
      );
    }

    const cards = customer.loyaltyCards.map((c) => ({
      cardId: c.id,
      currentPoints: Math.floor(c.currentPoints),
      businessName: c.program.business.name,
      businessLogoUrl: c.program.business.logoUrl,
      programName: c.program.name,
      cardBgColor: c.program.cardBgColor,
      cardTextColor: c.program.cardTextColor,
    }));

    return NextResponse.json<ApiResponse>({ success: true, data: { cards } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Número de teléfono inválido" },
        { status: 400 }
      );
    }
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
