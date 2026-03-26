import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

const WALLET_API_BASE = "https://walletobjects.googleapis.com/walletobjects/v1";
const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!;

export async function GET() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_KEY!);
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
    });
    const client = await auth.getClient();
    const tokenResult = await (client as { getAccessToken: () => Promise<{ token: string }> }).getAccessToken();
    const token = tokenResult.token;

    const classId = `${ISSUER_ID}.business_cf4f45e9-533f-4451-aeb8-cd3b3aebd52e`;

    // 1. Check if class exists
    const checkRes = await fetch(`${WALLET_API_BASE}/loyaltyClass/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkBody = await checkRes.text();

    if (checkRes.ok) {
      return NextResponse.json({ step: "class_exists", classId, status: checkRes.status, body: JSON.parse(checkBody) });
    }

    // 2. Try to create the class
    const loyaltyClass = {
      id: classId,
      issuerName: "Test Business",
      programName: "Test Program",
      hexBackgroundColor: "#1a1a2e",
      reviewStatus: "UNDER_REVIEW",
    };

    const postRes = await fetch(`${WALLET_API_BASE}/loyaltyClass`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(loyaltyClass),
    });
    const postBody = await postRes.text();

    return NextResponse.json({
      step: "create_attempt",
      classId,
      issuerIdUsed: ISSUER_ID,
      serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL,
      checkStatus: checkRes.status,
      checkError: checkBody,
      createStatus: postRes.status,
      createBody: postBody,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
