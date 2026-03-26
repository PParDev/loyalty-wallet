import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Negocio de prueba
  const business = await prisma.business.upsert({
    where: { slug: "cafeteria-lupita" },
    update: {},
    create: {
      name: "Cafetería Lupita",
      slug: "cafeteria-lupita",
      category: "cafeteria",
      description: "La mejor cafetería de Tepic",
      phone: "3111234567",
      email: "lupita@cafeteria.com",
      address: "Av. México 123",
      city: "Tepic",
      latitude: 21.5045,
      longitude: -104.8945,
      geoRadiusMeters: 200,
    },
  });

  // Usuario admin
  const passwordHash = await bcrypt.hash("password123", 10);
  const adminUser = await prisma.businessUser.upsert({
    where: { email: "admin@cafeteria.com" },
    update: {},
    create: {
      businessId: business.id,
      name: "Lupita García",
      email: "admin@cafeteria.com",
      passwordHash,
      role: "admin",
    },
  });

  // Usuario cajero
  await prisma.businessUser.upsert({
    where: { email: "cajero@cafeteria.com" },
    update: {},
    create: {
      businessId: business.id,
      name: "Juan Cajero",
      email: "cajero@cafeteria.com",
      passwordHash: await bcrypt.hash("cajero123", 10),
      role: "cashier",
    },
  });

  // Programa de lealtad
  const program = await prisma.loyaltyProgram.upsert({
    where: { id: "program-lupita-001" },
    update: {},
    create: {
      id: "program-lupita-001",
      businessId: business.id,
      name: "Club Lupita",
      pointsPerVisit: 1,
      pointsPerCurrency: 1,
      cardBgColor: "#2d1b69",
      cardTextColor: "#ffffff",
    },
  });

  // Recompensas
  await prisma.reward.createMany({
    skipDuplicates: true,
    data: [
      {
        programId: program.id,
        name: "Café gratis",
        description: "Un café americano o capuchino gratis",
        pointsRequired: 10,
        rewardType: "freebie",
      },
      {
        programId: program.id,
        name: "20% de descuento",
        description: "Descuento en tu próxima compra",
        pointsRequired: 5,
        rewardType: "discount",
      },
      {
        programId: program.id,
        name: "Postre gratis",
        description: "Un postre de tu elección",
        pointsRequired: 15,
        rewardType: "freebie",
      },
    ],
  });

  // Cliente de prueba
  const customer = await prisma.customer.upsert({
    where: { phone: "3119876543" },
    update: {},
    create: {
      name: "María Ejemplo",
      email: "maria@ejemplo.com",
      phone: "3119876543",
    },
  });

  // Tarjeta de lealtad del cliente
  await prisma.loyaltyCard.upsert({
    where: { qrCodeData: "LW:test-card-001" },
    update: {},
    create: {
      customerId: customer.id,
      programId: program.id,
      currentPoints: 7,
      totalPointsEarned: 12,
      totalVisits: 12,
      qrCodeData: "LW:test-card-001",
    },
  });

  console.log("Seed completado");
  console.log(`   Negocio: ${business.name} (/${business.slug})`);
  console.log(`   Admin: admin@cafeteria.com / password123`);
  console.log(`   Cajero: cajero@cafeteria.com / cajero123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
