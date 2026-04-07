import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

  const business = await prisma.business.findFirst({
    where: { users: { some: { id: session.user.id } } },
    select: { slug: true },
  });

  if (!business) return NextResponse.json({ success: false, error: "Negocio no encontrado" }, { status: 404 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const registrationUrl = `${appUrl}/r/${business.slug}`;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "png";

  if (format === "svg") {
    const svg = await QRCode.toString(registrationUrl, { type: "svg", width: 500, margin: 2 });
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="qr-${business.slug}.svg"`,
      },
    });
  }

  const buffer = await QRCode.toBuffer(registrationUrl, { width: 500, margin: 2 });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${business.slug}.png"`,
    },
  });
}
