import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    return new Response("No autorizado", { status: 401 });
  }

  const businessId = session.user.businessId;

  const transactions = await prisma.transaction.findMany({
    where: {
      card: {
        program: {
          businessId,
        },
      },
    },
    include: {
      card: {
        include: {
          customer: true,
        },
      },
      location: true,
    } as any,
    orderBy: { createdAt: 'desc' },
    take: 5000
  }) as any[];

  const header = ["ID_Transaccion", "Fecha_UTC", "Tipo", "Puntos", "Monto_MXN", "Descripcion", "Cliente_Nombre", "Cliente_Telefono", "Sucursal"];
  
  const rows = transactions.map((tx: any) => [
    tx.id,
    new Date(tx.createdAt).toISOString(),
    tx.type,
    tx.points.toString(),
    tx.amountSpent?.toString() || "",
    tx.description || "",
    tx.card.customer.name,
    tx.card.customer.phone || "",
    tx.location?.name || "Todas/Admin"
  ]);

  const csvContent = [
    header.join(","),
    ...rows.map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics_export.csv"`,
    },
  });
}
