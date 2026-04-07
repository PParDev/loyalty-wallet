import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });

  const business = await prisma.business.findFirst({
    where: { users: { some: { id: session.user.id } } },
    select: { name: true, slug: true, logoUrl: true, description: true },
  });

  if (!business) return NextResponse.json({ success: false, error: "Negocio no encontrado" }, { status: 404 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const registrationUrl = `${appUrl}/r/${business.slug}`;

  const qrDataUrl = await QRCode.toDataURL(registrationUrl, { width: 400, margin: 2 });

  const logoSection = business.logoUrl
    ? `<image href="${business.logoUrl}" x="200" y="30" width="100" height="100" preserveAspectRatio="xMidYMid meet" />`
    : "";

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="750" viewBox="0 0 500 750">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap');
      text { font-family: 'Inter', 'Arial', sans-serif; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="500" height="750" rx="24" fill="#0f0a2a"/>
  <rect x="1" y="1" width="498" height="748" rx="23" fill="none" stroke="#6366f1" stroke-opacity="0.3" stroke-width="1"/>

  <!-- Logo -->
  ${logoSection}

  <!-- Business name -->
  <text x="250" y="${business.logoUrl ? "165" : "80"}" text-anchor="middle" fill="white" font-size="26" font-weight="700">${escapeXml(business.name)}</text>

  <!-- Subtitle -->
  <text x="250" y="${business.logoUrl ? "195" : "110"}" text-anchor="middle" fill="#a5b4fc" font-size="14" font-weight="400">Programa de lealtad digital</text>

  <!-- QR container -->
  <rect x="100" y="${business.logoUrl ? "220" : "140"}" width="300" height="300" rx="20" fill="white"/>
  <image href="${qrDataUrl}" x="110" y="${business.logoUrl ? "230" : "150"}" width="280" height="280" />

  <!-- Instructions -->
  <text x="250" y="${business.logoUrl ? "565" : "485"}" text-anchor="middle" fill="white" font-size="18" font-weight="600">Escanea y únete</text>
  <text x="250" y="${business.logoUrl ? "590" : "510"}" text-anchor="middle" fill="#a5b4fc" font-size="13">Tu tarjeta de lealtad directo en tu celular</text>

  <!-- Steps -->
  <text x="100" y="${business.logoUrl ? "630" : "555"}" fill="#818cf8" font-size="12" font-weight="600">① Escanea el QR con tu cámara</text>
  <text x="100" y="${business.logoUrl ? "655" : "580"}" fill="#818cf8" font-size="12" font-weight="600">② Registra tu nombre y teléfono</text>
  <text x="100" y="${business.logoUrl ? "680" : "605"}" fill="#818cf8" font-size="12" font-weight="600">③ Agrega la tarjeta a tu wallet</text>

  <!-- Footer -->
  <text x="250" y="725" text-anchor="middle" fill="#6366f1" font-size="10" font-weight="400">${escapeXml(registrationUrl)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `inline; filename="flyer-${business.slug}.svg"`,
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
