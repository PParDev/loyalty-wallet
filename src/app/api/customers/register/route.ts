import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateQrData } from "@/lib/qr";
import { rateLimitPublic, checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional().or(z.literal("")),
  businessSlug: z.string(),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(rateLimitPublic, req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const business = await prisma.business.findUnique({
      where: { slug: data.businessSlug, isActive: true },
      include: { loyaltyPrograms: { where: { isActive: true }, take: 1 } },
    });

    if (!business || !business.loyaltyPrograms[0]) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Negocio no encontrado" }, { status: 404 });
    }

    const program = business.loyaltyPrograms[0];

    // Crear o encontrar cliente por teléfono
    let customer = await prisma.customer.findUnique({ where: { phone: data.phone } });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
        },
      });
    }

    // Verificar si ya tiene tarjeta en este programa
    const existingCard = await prisma.loyaltyCard.findUnique({
      where: { customerId_programId: { customerId: customer.id, programId: program.id } },
    });

    if (existingCard) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { cardId: existingCard.id, alreadyRegistered: true, qrCodeData: existingCard.qrCodeData },
      });
    }

    // Crear tarjeta nueva
    const card = await prisma.loyaltyCard.create({
      data: {
        customerId: customer.id,
        programId: program.id,
        qrCodeData: generateQrData(crypto.randomUUID()),
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { cardId: card.id, alreadyRegistered: false, qrCodeData: card.qrCodeData },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}
