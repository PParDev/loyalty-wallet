import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToken, removeNotificationFromWalletCards } from "@/lib/google-wallet";
import type { ApiResponse } from "@/types";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });

  const { id } = await params;

  const notification = await prisma.notification.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!notification) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Notificación no encontrada" }, { status: 404 });
  }

  // Eliminar el mensaje de todas las tarjetas en Google Wallet
  if (notification.googleMessageId) {
    try {
      const token = await getToken();
      await removeNotificationFromWalletCards(session.user.businessId, notification.googleMessageId, token);
    } catch (err) {
      console.error("[notifications] Error eliminando mensaje de GW:", err);
    }
  }

  await prisma.notification.delete({ where: { id } });

  return NextResponse.json<ApiResponse>({ success: true, data: null });
}
