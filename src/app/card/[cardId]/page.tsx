"use client";

import { useEffect, useState, use } from "react";

interface TierInfo {
  id: string;
  name: string;
  color: string;
  benefits: string | null;
  multiplier: number;
}

interface CardData {
  cardId: string;
  customerName: string;
  currentPoints: number;
  totalPointsEarned: number;
  totalVisits: number;
  pointsExpiresAt: string | null;
  qrCodeData: string;
  tier: TierInfo | null;
  program: {
    name: string;
    earningMode: string;
    cardBgColor: string;
    cardTextColor: string;
    pointsPerVisit: number;
    pointsExpirationDays: number | null;
  };
  business: {
    name: string;
    logoUrl: string | null;
  };
}

interface Transaction {
  id: string;
  type: "earn" | "redeem" | "adjust";
  points: number;
  amountSpent: string | null;
  description: string | null;
  createdAt: string;
}


export default function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const [card, setCard] = useState<CardData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [suspended, setSuspended] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [googleWalletUrl, setGoogleWalletUrl] = useState<string | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  const handleShowHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    setLoadingHistory(true);
    const res = await fetch(`/api/cards/${cardId}/history`).then((r) => r.json());
    if (res.success) {
      setTransactions(res.data);
    }
    setLoadingHistory(false);
    setShowHistory(true);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
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

  // Expiración
  const expirationText = (() => {
    if (!card.pointsExpiresAt) return null;
    const daysLeft = Math.ceil((new Date(card.pointsExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return null; // ya vencidos, se reinician en la siguiente visita
    const dateStr = new Date(card.pointsExpiresAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    if (daysLeft <= 7) return { text: `⚠️ Tus puntos vencen el ${dateStr} (${daysLeft} días)`, urgent: true };
    return { text: `Válidos hasta el ${dateStr}`, urgent: false };
  })();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
      {/* Tarjeta visual */}
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl mb-6"
        style={{ backgroundColor: bg, color: fg }}
      >
        <div className="flex items-center justify-between mb-4">
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

        {/* Badge de nivel */}
        {card.tier && (
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-gray-900"
              style={{ backgroundColor: card.tier.color }}
            >
              ★ {card.tier.name}
              {card.tier.multiplier > 1 && <span className="opacity-70">× {card.tier.multiplier}</span>}
            </span>
            {card.tier.benefits && (
              <p className="text-xs mt-1 opacity-70">{card.tier.benefits}</p>
            )}
          </div>
        )}

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

      {/* Aviso de expiración */}
      {expirationText && (
        <div className={`w-full max-w-sm rounded-2xl px-4 py-3 mb-4 text-sm ${expirationText.urgent ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-white border border-gray-200 text-gray-500"}`}>
          {expirationText.text}
        </div>
      )}

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
          {loadingWallet ? "Generando..." : googleWalletUrl ? "Agregar de nuevo" : "Agregar a Google Wallet"}
        </button>

        {/* Historial */}
        <button
          onClick={handleShowHistory}
          disabled={loadingHistory}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 py-3.5 rounded-2xl font-medium text-base border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {loadingHistory ? "Cargando..." : showHistory ? "Ocultar historial" : "Ver historial de puntos"}
        </button>

        {/* Lista de transacciones */}
        {showHistory && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Últimas 50 transacciones</p>
            </div>

            {transactions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Aún no hay transacciones registradas
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === "earn" ? "bg-green-100" : tx.type === "redeem" ? "bg-amber-100" : "bg-gray-100"
                    }`}>
                      {tx.type === "earn" ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      ) : tx.type === "redeem" ? (
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {tx.description ?? (tx.type === "earn" ? "Puntos ganados" : tx.type === "redeem" ? "Canje" : "Ajuste")}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(tx.createdAt)} · {formatTime(tx.createdAt)}
                        {tx.amountSpent && ` · $${parseFloat(tx.amountSpent).toFixed(0)} MXN`}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${tx.points > 0 ? "text-green-600" : "text-red-500"}`}>
                      {tx.points > 0 ? "+" : ""}{tx.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Instrucciones guardar en pantalla */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-2">Guardar en tu pantalla de inicio</p>
          <div className="space-y-1.5 text-sm text-gray-500">
            <p>
              <span className="font-medium text-gray-700">iPhone:</span> Toca el botón de compartir{" "}
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
