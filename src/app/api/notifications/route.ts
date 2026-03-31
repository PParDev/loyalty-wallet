import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToken, sendNotificationToWalletCards } from "@/lib/google-wallet";
import { randomUUID } from "crypto";
import type { ApiResponse } from "@/types";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "15")));
  const skip = (page - 1) * limit;

  const where = { businessId: session.user.businessId };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return NextResponse.json<ApiResponse>({ success: true, data: { notifications, total, page, limit } });
}

const createSchema = z.object({
  title: z.string().min(2).max(100),
  message: z.string().min(2).max(500),
  type: z.enum(["push", "scheduled"]).default("push"),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const isScheduled = data.type === "scheduled" && data.scheduledAt;

    const googleMessageId = randomUUID();

    const notification = await prisma.notification.create({
      data: {
        businessId: session.user.businessId,
        title: data.title,
        message: data.message,
        type: data.type,
        status: isScheduled ? "scheduled" : "sent",
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        sentAt: isScheduled ? null : new Date(),
        googleMessageId: isScheduled ? null : googleMessageId,
      },
    });

    if (!isScheduled) {
      try {
        const token = await getToken();
        const sentCount = await sendNotificationToWalletCards(
          session.user.businessId,
          data.title,
          data.message,
          token,
          googleMessageId
        );
        await prisma.notification.update({
          where: { id: notification.id },
          data: { sentCount },
        });
        return NextResponse.json<ApiResponse>({
          success: true,
          data: { ...notification, sentCount },
        }, { status: 201 });
      } catch (err) {
        console.error("[Notification] Error enviando a Google Wallet:", err);
        // La notificación ya quedó guardada, no fallar la respuesta completa
      }
    }

    return NextResponse.json<ApiResponse>({ success: true, data: notification }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno" }, { status: 500 });
  }
}
