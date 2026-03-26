import QRCode from "qrcode";

const QR_PREFIX = "LW:";

export function generateQrData(cardId: string): string {
  return `${QR_PREFIX}${cardId}`;
}

export function parseQrData(qrData: string): string | null {
  if (!qrData.startsWith(QR_PREFIX)) return null;
  return qrData.slice(QR_PREFIX.length);
}

export async function generateQrCodeBase64(cardId: string): Promise<string> {
  const data = generateQrData(cardId);
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function generateQrCodeBuffer(cardId: string): Promise<Buffer> {
  const data = generateQrData(cardId);
  return QRCode.toBuffer(data, {
    width: 300,
    margin: 2,
  });
}
