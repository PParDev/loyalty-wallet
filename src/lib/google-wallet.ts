import { GoogleAuth } from "google-auth-library";
import { prisma } from "@/lib/prisma";

// Workaround: el TS server puede tener caché del cliente anterior a prisma generate.
// Estos tipos reflejan los campos reales en la BD.
type TierRow = { id: string; name: string; minPoints: number; benefits: string | null; multiplier: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as unknown as { tier: { findMany: (args: object) => Promise<TierRow[]> } } & typeof prisma;

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
    reviewStatus: "UNDER_REVIEW",
  };

  if (business.latitude && business.longitude) {
    loyaltyClass.merchantLocations = [{ latitude: Number(business.latitude), longitude: Number(business.longitude) }];
  }

  // Links personalizados configurados por el negocio
  const savedLinks = ((business as unknown as { links: unknown }).links ?? []) as { id: string; label: string; url: string }[];
  if (savedLinks.length > 0) {
    loyaltyClass.linksModuleData = {
      uris: savedLinks.map((l) => ({ uri: l.url, description: l.label, id: l.id })),
    };
  }

  await upsert(`${WALLET_API_BASE}/loyaltyClass`, loyaltyClass, token);
  return classId;
}

export async function createOrUpdateLoyaltyObject(cardId: string, token: string): Promise<string | null> {
  const card = await prisma.loyaltyCard.findUnique({
    where: { id: cardId },
    include: {
      customer: true,
      program: {
        include: {
          business: true,
          rewards: { where: { isActive: true }, orderBy: { pointsRequired: "asc" } },
        },
      },
    },
  });

  if (!card) return null;

  const tiers = await db.tier.findMany({
    where: { programId: card.program.id },
    orderBy: { minPoints: "desc" },
  });

  const classId = `${ISSUER_ID}.business_${card.program.businessId}`;
  const objectId = `${ISSUER_ID}.card_${cardId}`;

  const textModulesData: { header: string; body: string; id: string }[] = [];

  // Módulo de tier/nivel activo
  const activeTier = tiers.find((t) => t.minPoints <= card.totalPointsEarned);
  if (activeTier) {
    const nextTier = [...tiers].reverse().find((t) => t.minPoints > card.totalPointsEarned);
    const body = nextTier
      ? `Faltan ${nextTier.minPoints - card.totalPointsEarned} pts para ${nextTier.name}${activeTier.benefits ? ` · ${activeTier.benefits}` : ""}`
      : `Nivel máximo alcanzado${activeTier.benefits ? ` · ${activeTier.benefits}` : ""}`;
    textModulesData.push({ header: `Nivel: ${activeTier.name}`, body, id: "tier" });
  }

  // Módulo de barra de progreso hacia la siguiente recompensa
  const nextReward = card.program.rewards.find((r) => r.pointsRequired > card.currentPoints);
  if (nextReward) {
    const needed = nextReward.pointsRequired - card.currentPoints;
    const prevThreshold = card.program.rewards.filter((r) => r.pointsRequired <= card.currentPoints).at(-1)?.pointsRequired ?? 0;
    const total = nextReward.pointsRequired - prevThreshold;
    const earned = card.currentPoints - prevThreshold;
    const filledBlocks = Math.round((earned / total) * 10);
    const bar = "█".repeat(filledBlocks) + "░".repeat(10 - filledBlocks);
    textModulesData.push({
      header: `Progreso: ${nextReward.name}`,
      body: `${bar}  ${card.currentPoints}/${nextReward.pointsRequired} pts — faltan ${needed}`,
      id: "next_reward",
    });
  } else if (card.program.rewards.length > 0) {
    textModulesData.push({
      header: "🎉 ¡Tienes recompensas disponibles!",
      body: "Muestra tu tarjeta al cajero para canjear.",
      id: "rewards_ready",
    });
  }

  const loyaltyObject: Record<string, unknown> = {
    id: objectId,
    classId,
    state: "ACTIVE",
    loyaltyPoints: {
      label: "Puntos",
      balance: { int: Math.round(card.currentPoints) },
    },
    barcode: {
      type: "QR_CODE",
      value: card.qrCodeData,
      alternateText: card.qrCodeData,
    },
    accountId: card.id,
    accountName: card.customer.name,
  };

  if (textModulesData.length > 0) {
    loyaltyObject.textModulesData = textModulesData;
  }

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

// #1 — Actualiza puntos y notifica al cliente en Google Wallet
export async function updateCardPoints(cardId: string): Promise<void> {
  const card = await prisma.loyaltyCard.findUnique({
    where: { id: cardId },
    include: {
      program: {
        include: {
          rewards: { where: { isActive: true }, orderBy: { pointsRequired: "asc" } },
        },
      },
    },
  });
  if (!card?.googlePassId) return;

  const tiers = await db.tier.findMany({
    where: { programId: card.program.id },
    orderBy: { minPoints: "desc" },
  });

  const token = await getToken();
  const objectId = `${ISSUER_ID}.card_${cardId}`;

  const textModulesData: { header: string; body: string; id: string }[] = [];

  // Módulo de tier/nivel activo
  const activeTier = tiers.find((t) => t.minPoints <= card.totalPointsEarned);
  if (activeTier) {
    const nextTier = [...tiers].reverse().find((t) => t.minPoints > card.totalPointsEarned);
    const body = nextTier
      ? `Faltan ${nextTier.minPoints - card.totalPointsEarned} pts para ${nextTier.name}${activeTier.benefits ? ` · ${activeTier.benefits}` : ""}`
      : `Nivel máximo alcanzado${activeTier.benefits ? ` · ${activeTier.benefits}` : ""}`;
    textModulesData.push({ header: `Nivel: ${activeTier.name}`, body, id: "tier" });
  }

  const nextReward = card.program.rewards.find((r) => r.pointsRequired > card.currentPoints);
  if (nextReward) {
    const needed = nextReward.pointsRequired - card.currentPoints;
    const prevThreshold = card.program.rewards.filter((r) => r.pointsRequired <= card.currentPoints).at(-1)?.pointsRequired ?? 0;
    const total = nextReward.pointsRequired - prevThreshold;
    const earned = card.currentPoints - prevThreshold;
    const filledBlocks = Math.round((earned / total) * 10);
    const bar = "█".repeat(filledBlocks) + "░".repeat(10 - filledBlocks);
    textModulesData.push({
      header: `Progreso: ${nextReward.name}`,
      body: `${bar}  ${card.currentPoints}/${nextReward.pointsRequired} pts — faltan ${needed}`,
      id: "next_reward",
    });
  } else if (card.program.rewards.length > 0) {
    textModulesData.push({
      header: "🎉 ¡Tienes recompensas disponibles!",
      body: "Muestra tu tarjeta al cajero para canjear.",
      id: "rewards_ready",
    });
  }

  const patch: Record<string, unknown> = {
    loyaltyPoints: { balance: { int: Math.round(card.currentPoints) } },
    // notifyPreference es transitorio: Google lo procesa y lo descarta, no queda guardado
    notifyPreference: "notifyOnUpdate",
  };

  if (textModulesData.length > 0) {
    patch.textModulesData = textModulesData;
  }

  await fetch(`${WALLET_API_BASE}/loyaltyObject/${objectId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function sendNotificationToWalletCards(
  businessId: string,
  title: string,
  message: string,
  token: string
): Promise<number> {
  const cards = await prisma.loyaltyCard.findMany({
    where: {
      program: { businessId, isActive: true },
      googlePassId: { not: null },
    },
    select: { id: true },
  });

  if (cards.length === 0) return 0;

  const results = await Promise.allSettled(
    cards.map(async (card) => {
      const objectId = `${ISSUER_ID}.card_${card.id}`;
      const url = `${WALLET_API_BASE}/loyaltyObject/${objectId}/addMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: { header: title, body: message, messageType: "TEXT_AND_NOTIFY" },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[Notify] Error ${res.status} para ${objectId}: ${text.slice(0, 200)}`);
      }
      return res;
    })
  );

  return results.filter((r) => r.status === "fulfilled" && (r.value as Response).ok).length;
}

export { getToken };
