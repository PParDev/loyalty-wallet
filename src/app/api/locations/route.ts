import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const locations = await prisma.location.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json<ApiResponse>({ success: true, data: locations });
  } catch (error) {
    return NextResponse.json<ApiResponse>({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}

const createLocationSchema = z.object({
  name: z.string().min(2),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    return NextResponse.json<ApiResponse>({ success: false, error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json<ApiResponse>({ success: false, error: "Sin permisos" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createLocationSchema.parse(body);

    const location = await prisma.location.create({
      data: {
        businessId: session.user.businessId,
        ...data,
      },
    });

    return NextResponse.json<ApiResponse>({ success: true, data: location });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}
