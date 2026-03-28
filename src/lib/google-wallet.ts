import { GoogleAuth } from "google-auth-library";
import { prisma } from "@/lib/prisma";

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";
const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;

async function getToken(): Promise<string> {
  const credentials = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY!);
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });
  const client = await auth.getClient();
  const result = await (client as { getAccessToken: () => Promise<{ token: string }> }).getAccessToken();
  return result.token;
}

async function upsert(url: string, body: object, token: string): Promise<void> {
  const postRes = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (postRes.ok) return;

  const text = await postRes.text();

  // Si ya existe, hacer PATCH
  if (postRes.status === 409 || text.includes("already exists") || text.includes("ALREADY_EXISTS")) {
    const id = (body as { id: string }).id;
    const patchRes = await fetch(`${url}/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!patchRes.ok) {
      const patchErr = await patchRes.text();
      console.error("[GW] PATCH error:", patchErr);
      throw new Error(`PATCH failed (${patchRes.status}): ${patchErr}`);
    }
    return;
  }

  console.error("[GW] POST error:", text);
  throw new Error(`POST failed (${postRes.status}): ${text}`);
}

export async function createOrUpdateLoyaltyClass(businessId: string, token: string): Promise<string | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { loyaltyPrograms: { where: { isActive: true }, take: 1 } },
  });

  if (!business || !business.loyaltyPrograms[0]) return null;

  const program = business.loyaltyPrograms[0];
  const classId = `${ISSUER_ID}.business_${businessId}`;
  const logoUri = business.logoUrl ?? "https://placehold.co/128x128/1a1a2e/ffffff.png";

  const loyaltyClass: Record<string, unknown> = {
    id: classId,
    issuerName: business.name,
    programName: program.name,
    programLogo: {
      sourceUri: { uri: logoUri },
      contentDescription: { defaultValue: { language: "en-US", value: business.name } },
    },
    hexBackgroundColor: program.cardBgColor,
  };

  if (business.latitude && business.longitude) {
    loyaltyClass.locations = [{ latitude: Number(business.latitude), longitude: Number(business.longitude) }];
  }

  await upsert(`${WALLET_API_BASE}/loyaltyClass`, loyaltyClass, token);
  return classId;
}

export async function createOrUpdateLoyaltyObject(cardId: string, token: string): Promise<string | null> {
  const card = await prisma.loyaltyCard.findUnique({
    where: { id: cardId },
    include: {
      customer: true,
      program: { include: { business: true } },
    },
  });

  if (!card) return null;

  const classId = `${ISSUER_ID}.business_${card.program.businessId}`;
  const objectId = `${ISSUER_ID}.card_${cardId}`;

  const loyaltyObject = {
    id: objectId,
    classId,
    state: "ACTIVE",
    loyaltyPoints: {
      label: "Puntos",
      balance: { int: card.currentPoints },
    },
    barcode: {
      type: "QR_CODE",
      value: card.qrCodeData,
      alternateText: card.qrCodeData,
    },
    accountId: card.id,
    accountName: card.customer.name,
  };

  await upsert(`${WALLET_API_BASE}/loyaltyObject`, loyaltyObject, token);

  const { sign } = await import("jsonwebtoken");
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY!);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  const claims = {
    iss: serviceAccountEmail,
    aud: "google",
    origins: [appUrl],
    typ: "savetowallet",
    payload: {
      loyaltyObjects: [loyaltyObject],
    },
  };

  const jwtToken = sign(claims, serviceAccountKey.private_key, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${jwtToken}`;
}

export async function updateCardPoints(cardId: string): Promise<void> {
  const card = await prisma.loyaltyCard.findUnique({ where: { id: cardId } });
  if (!card?.googlePassId) return;

  const token = await getToken();
  const objectId = `${ISSUER_ID}.card_${cardId}`;

  await fetch(`${WALLET_API_BASE}/loyaltyObject/${objectId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      loyaltyPoints: { balance: { int: card.currentPoints } },
    }),
  });
}

export { getToken };
