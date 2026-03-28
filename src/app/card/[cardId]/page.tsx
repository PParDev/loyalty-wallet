"use client";

import { useEffect, useState, use } from "react";

interface CardData {
  cardId: string;
  customerName: string;
  currentPoints: number;
  totalVisits: number;
  qrCodeData: string;
  program: {
    name: string;
    cardBgColor: string;
    cardTextColor: string;
    pointsPerVisit: number;
  };
  business: {
    name: string;
    logoUrl: string | null;
  };
}

export default function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const [card, setCard] = useState<CardData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [googleWalletUrl, setGoogleWalletUrl] = useState<string | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const [suspended, setSuspended] = useState(false);

  useEffect(() => {
    fetch(`/api/cards/${cardId}/public`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCard(res.data);
        } else if (res.error === "SUSPENDED") {
          setSuspended(true);
        } else {
          setNotFound(true);
        }
      });
  }, [cardId]);

  // Generar QR code en el cliente
  useEffect(() => {
    if (!card) return;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(card.qrCodeData, {
        width: 280,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl);
    });
  }, [card]);

  const handleGoogleWallet = async () => {
    setLoadingWallet(true);
    const res = await fetch("/api/wallet/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    }).then((r) => r.json());

    if (res.success) {
      setGoogleWalletUrl(res.data.saveUrl);
      window.open(res.data.saveUrl, "_blank");
    }
    setLoadingWallet(false);
  };

  if (suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Programa temporalmente inactivo</h2>
          <p className="text-gray-500 text-sm">Este programa de lealtad no está disponible en este momento. Tus puntos están seguros y se reactivarán cuando el negocio vuelva a estar activo.</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <p className="text-gray-500 text-lg">Tarjeta no encontrada</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const bg = card.program.cardBgColor;
  const fg = card.program.cardTextColor;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-10">
      {/* Tarjeta visual */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl mb-6"
        style={{ backgroundColor: bg, color: fg }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            {card.business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.business.logoUrl} alt={card.business.name} className="h-10 object-contain" />
            ) : (
              <p className="text-lg font-bold">{card.business.name}</p>
            )}
            <p className="text-sm opacity-70 mt-0.5">{card.program.name}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{card.currentPoints}</p>
            <p className="text-xs opacity-60">puntos</p>
          </div>
        </div>

        {/* QR */}
        <div className="flex justify-center bg-white rounded-2xl p-4 mb-4">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR de tu tarjeta" className="w-52 h-52" />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="font-semibold text-lg">{card.customerName}</p>
          <p className="text-xs opacity-50 mt-0.5">{card.totalVisits} visitas</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleGoogleWallet}
          disabled={loadingWallet}
          className="w-full flex items-center justify-center gap-3 bg-black text-white py-3.5 rounded-2xl font-medium text-base hover:bg-gray-900 disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
          {loadingWallet ? "Generando..." : "Agregar a Google Wallet"}
        </button>

        {/* Instrucciones guardar en pantalla */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-2">Guardar en tu pantalla de inicio</p>
          <div className="space-y-1.5 text-sm text-gray-500">
            <p>
              <span className="font-medium text-gray-700">iPhone:</span> Toca el botón de compartir
              {" "}
              <span className="inline-block border border-gray-300 rounded px-1 text-xs">⬆</span>
              {" → "}Añadir a pantalla de inicio
            </p>
            <p>
              <span className="font-medium text-gray-700">Android:</span> Menú del navegador (⋮) → Añadir a pantalla de inicio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
