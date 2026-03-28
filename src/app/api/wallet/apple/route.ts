import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateApplePass } from "@/lib/apple-wallet";

const schema = z.object({ cardId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cardId } = schema.parse(body);

    const card = await prisma.loyaltyCard.findUnique({ where: { id: cardId } });
    if (!card) return new NextResponse("Tarjeta no encontrada", { status: 404 });

    const passBuffer = await generateApplePass(cardId);
    if (!passBuffer) return new NextResponse("Error generando el pase de Apple Wallet", { status: 500 });

    if (!card.applePassSerial) {
      await prisma.loyaltyCard.update({ where: { id: cardId }, data: { applePassSerial: `${process.env.APPLE_PASS_TYPE_ID}.${cardId}` } });
    }

    return new NextResponse(passBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="loyalty.pkpass"`,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return new NextResponse(err.issues[0].message, { status: 400 });
    console.error(err);
    return new NextResponse("Error interno", { status: 500 });
  }
}
