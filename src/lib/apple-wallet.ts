import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";

export async function generateApplePass(cardId: string): Promise<Buffer | null> {
  const card = await prisma.loyaltyCard.findUnique({
    where: { id: cardId },
    include: {
      customer: true,
      program: { include: { business: true } },
    },
  });

  if (!card) return null;

  const certPath = process.env.APPLE_CERT_PATH!;
  const keyPath = process.env.APPLE_KEY_PATH!;
  const passPhrase = process.env.APPLE_KEY_PASSPHRASE;
  const passTypeId = process.env.APPLE_PASS_TYPE_ID!;
  const teamId = process.env.APPLE_TEAM_ID!;

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error("Apple Wallet certificates not found");
    return null;
  }

  const wwdrPath = path.join(process.cwd(), "certs", "wwdr.pem");

  const pass = await PKPass.from({
    model: path.join(process.cwd(), "passes", "loyalty.pass"),
    certificates: {
      wwdr: fs.readFileSync(wwdrPath),
      signerCert: fs.readFileSync(certPath),
      signerKey: fs.readFileSync(keyPath),
      signerKeyPassphrase: passPhrase,
    },
  }, {
    serialNumber: card.id,
    description: `${card.program.business.name} - Tarjeta de Lealtad`,
    organizationName: card.program.business.name,
    passTypeIdentifier: passTypeId,
    teamIdentifier: teamId,
    backgroundColor: `rgb(${hexToRgb(card.program.cardBgColor)})`,
    foregroundColor: `rgb(${hexToRgb(card.program.cardTextColor)})`,
    logoText: card.program.business.name,
  });

  pass.type = "storeCard";

  pass.primaryFields.push({
    key: "points",
    label: "Puntos",
    value: card.currentPoints,
  });

  pass.secondaryFields.push({
    key: "name",
    label: "Cliente",
    value: card.customer.name,
  }, {
    key: "visits",
    label: "Visitas",
    value: card.totalVisits,
  });

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: card.qrCodeData,
    messageEncoding: "iso-8859-1",
  });

  if (card.program.business.latitude && card.program.business.longitude) {
    pass.setLocations({
      longitude: Number(card.program.business.longitude),
      latitude: Number(card.program.business.latitude),
      relevantText: `¡Estás cerca de ${card.program.business.name}! Muestra tu tarjeta.`,
    });
  }

  return pass.getAsBuffer();
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "26, 26, 46";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
