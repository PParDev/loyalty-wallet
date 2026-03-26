import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import type { ApiResponse } from "@/types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  category: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existingUser = await prisma.businessUser.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json<ApiResponse>({ success: false, error: "El correo ya está registrado" }, { status: 400 });
    }

    const slug = await generateUniqueSlug(data.businessName);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const business = await prisma.business.create({
      data: {
        name: data.businessName,
        slug,
        category: data.category,
        users: {
          create: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: "admin",
          },
        },
        loyaltyPrograms: {
          create: {
            name: `Programa de lealtad ${data.businessName}`,
            pointsPerVisit: 1,
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { businessId: business.id, slug: business.slug },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({ success: false, error: err.issues[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json<ApiResponse>({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
