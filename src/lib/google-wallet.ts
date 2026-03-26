import { GoogleAuth } from "google-auth-library";
import { prisma } from "@/lib/prisma";

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";
const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY!);
  return new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });
}

async function getAuthClient() {
  const auth = getAuth();
  return auth.getClient();
}

export async function createOrUpdateLoyaltyClass(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { loyaltyPrograms: { where: { isActive: true }, take: 1 } },
  });

  if (!business || !business.loyaltyPrograms[0]) return null;

  const program = business.loyaltyPrograms[0];
  const classId = `${ISSUER_ID}.business_${businessId}`;

  const loyaltyClass = {
    id: classId,
    issuerName: business.name,
    programName: program.name,
    programLogo: business.logoUrl
      ? { sourceUri: { uri: business.logoUrl }, contentDescription: { defaultValue: { language: "es", value: business.name } } }
      : undefined,
    hexBackgroundColor: program.cardBgColor,
    reviewStatus: "UNDER_REVIEW",
    locations: business.latitude && business.longitude
      ? [{ latitude: Number(business.latitude), longitude: Number(business.longitude) }]
      : [],
  };

  const client = await getAuthClient();
  const token = await (client as { getAccessToken: () => Promise<{ token: string }> }).getAccessToken();

  const checkRes = await fetch(`${WALLET_API_BASE}/loyaltyClass/${classId}`, {
    headers: { Authorization: `Bearer ${token.token}` },
  });

  if (checkRes.ok) {
    const patchRes = await fetch(`${WALLET_API_BASE}/loyaltyClass/${classId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(loyaltyClass),
    });
    if (!patchRes.ok) console.error("[GW] PATCH class error:", await patchRes.text());
  } else {
    const postRes = await fetch(`${WALLET_API_BASE}/loyaltyClass`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(loyaltyClass),
    });
    if (!postRes.ok) {
      const err = await postRes.text();
      console.error("[GW] POST class error:", err);
      throw new Error(`Class creation failed: ${err}`);
    }
  }

  console.log("[GW] classId:", classId);
  return classId;
}

export async function createOrUpdateLoyaltyObject(cardId: string): Promise<string | null> {
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

  const client = await getAuthClient();
  const token = await (client as { getAccessToken: () => Promise<{ token: string }> }).getAccessToken();

  const checkRes = await fetch(`${WALLET_API_BASE}/loyaltyObject/${objectId}`, {
    headers: { Authorization: `Bearer ${token.token}` },
  });

  console.log("[GW] objectId:", objectId, "classId:", classId);
  if (checkRes.ok) {
    const patchRes = await fetch(`${WALLET_API_BASE}/loyaltyObject/${objectId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(loyaltyObject),
    });
    if (!patchRes.ok) console.error("[GW] PATCH object error:", await patchRes.text());
  } else {
    const postRes = await fetch(`${WALLET_API_BASE}/loyaltyObject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(loyaltyObject),
    });
    if (!postRes.ok) {
      const err = await postRes.text();
      console.error("[GW] POST object error:", err);
      throw new Error(`Object creation failed: ${err}`);
    }
  }

  // Generar JWT para el botón "Add to Google Wallet"
  const { sign } = await import("jsonwebtoken");
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY!);

  const claims = {
    iss: serviceAccountEmail,
    aud: "google",
    origins: [process.env.NEXT_PUBLIC_APP_URL!],
    typ: "savetowallet",
    payload: {
      loyaltyObjects: [{ id: objectId }],
    },
  };

  const jwtToken = sign(claims, serviceAccountKey.private_key, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${jwtToken}`;
}

export async function updateCardPoints(cardId: string): Promise<void> {
  const card = await prisma.loyaltyCard.findUnique({ where: { id: cardId } });
  if (!card?.googlePassId) return;

  const objectId = `${ISSUER_ID}.card_${cardId}`;
  const client = await getAuthClient();
  const token = await (client as { getAccessToken: () => Promise<{ token: string }> }).getAccessToken();

  await fetch(`${WALLET_API_BASE}/loyaltyObject/${objectId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      loyaltyPoints: { balance: { int: card.currentPoints } },
    }),
  });
}
