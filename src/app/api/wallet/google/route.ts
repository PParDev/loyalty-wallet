import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getToken, createOrUpdateLoyaltyClass, createOrUpdateLoyaltyObject } from "@/lib/google-wallet";
import type { ApiResponse } from "@/types";

const schema = z.object({ cardId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cardId } = schema.parse(body);

    const card = await prisma.loyaltyCard.findUnique({
      where: { id: cardId },
      include: { program: true },
    });
    if (!card) return NextResponse.json<ApiResponse>({ success: false, error: "Tarjeta no encontrada" }, { status: 404 });

    // Token único para todas las llamadas a Google
    const token = await getToken();

    await createOrUpdateLoyaltyClass(card.program.businessId, token);
    const saveUrl = await createOrUpdateLoyaltyObject(cardId, token);
    if (!saveUrl) {
      return NextResponse.json<ApiResponse>({ success: false, error: "Error generando el pase de Google Wallet" }, { status: 500 });
    }

    if (!card.googlePassId) {
      const objectId = `${process.env.GOOGLE_WALLET_ISSUER_ID}.card_${cardId}`;
      await prisma.loyaltyCard.update({ where: { id: cardId }, data: { googlePassId: objectId } });
    }

    return NextResponse.json<ApiResponse>({ success: true, data: { saveUrl } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    console.error("[wallet/google] error:", err);
    return NextResponse.json<ApiResponse>({ success: false, error: String(err) }, { status: 500 });
  }
}
