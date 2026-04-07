"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { CardScanResult } from "@/types";

const QrScanner = dynamic(() => import("@/components/scan/QrScanner"), { ssr: false });

type KioskState = "scanning" | "result" | "success";

export default function KioskPage() {
  const [state, setState] = useState<KioskState>("scanning");
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "phone">("camera");

  const reset = useCallback(() => {
    setState("scanning");
    setScanResult(null);
    setError(null);
    setFeedback(null);
    setPhoneInput("");
  }, []);

  // Auto-reset after success
  useEffect(() => {
    if (state !== "success") return;
    const timeout = setTimeout(reset, 3000);
    return () => clearTimeout(timeout);
  }, [state, reset]);

  const handleScan = async (qrCodeData: string) => {
    setError(null);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCodeData }),
    }).then((r) => r.json());

    if (res.success) {
      setScanResult(res.data);
      setState("result");
    } else {
      setError(res.error);
    }
  };

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setError(null);
    const res = await fetch(`/api/scan?phone=${encodeURIComponent(phoneInput.trim())}`).then((r) => r.json());
    if (res.success) {
      setScanResult(res.data);
      setState("result");
    } else {
      setError(res.error);
    }
  };

  const handleQuickAdd = async () => {
    if (!scanResult) return;
    const isStamps = scanResult.program.earningMode === "stamps";

    const res = await fetch(`/api/cards/${scanResult.cardId}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isStamps ? { points: 1 } : {}),
    }).then((r) => r.json());

    if (res.success) {
      const added = res.data.pointsAdded % 1 === 0 ? res.data.pointsAdded : res.data.pointsAdded.toFixed(1);
      setFeedback(`+${added} ${isStamps ? "sello" : "punto"}${Number(added) !== 1 ? "s" : ""}`);
      setScanResult((prev) => prev ? { ...prev, currentPoints: res.data.newPoints } : prev);
      setState("success");
    } else {
      setError(res.error);
    }
  };

  const isStamps = scanResult?.program.earningMode === "stamps";

  return (
    <div className="fixed inset-0 bg-[#0a0a14] text-white flex flex-col z-[100]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/5 shrink-0">
        <h1 className="text-sm font-semibold text-indigo-400">LoyaltyWallet · Kiosk</h1>
        <a href="/dashboard" className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1 border border-gray-700 rounded-lg">
          ✕ Salir
        </a>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* SCANNING */}
        {state === "scanning" && (
          <div className="w-full max-w-md space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {error}
                <button onClick={() => setError(null)} className="block mt-1 text-xs text-red-300 underline mx-auto">Cerrar</button>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-700">
              <button
                onClick={() => setScanMode("camera")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${scanMode === "camera" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                📷 Cámara
              </button>
              <button
                onClick={() => setScanMode("phone")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${scanMode === "phone" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
              >
                📱 Teléfono
              </button>
            </div>

            {scanMode === "camera" ? (
              <div className="rounded-2xl overflow-hidden border border-gray-700 bg-black">
                <QrScanner onScan={handleScan} />
                <div className="p-4 text-center text-sm text-gray-400">
                  Escanea el QR del cliente
                </div>
              </div>
            ) : (
              <form onSubmit={handlePhoneSearch} className="space-y-3">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Número de teléfono"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-xl text-center text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!phoneInput.trim()}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-500 disabled:opacity-40 transition-colors"
                >
                  Buscar
                </button>
              </form>
            )}
          </div>
        )}

        {/* RESULT */}
        {state === "result" && scanResult && (
          <div className="w-full max-w-sm text-center space-y-6">
            {/* Customer info */}
            <div>
              <p className="text-[5rem] font-black leading-none text-white">
                {Math.floor(scanResult.currentPoints)}
              </p>
              <p className="text-lg text-gray-400 mt-1">
                {isStamps ? "sellos" : "puntos"}
              </p>
            </div>

            <div>
              <p className="text-xl font-bold text-white">{scanResult.customer.name}</p>
              <p className="text-sm text-gray-500">{scanResult.customer.phone}</p>
              {scanResult.tier && (
                <span
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold text-gray-900"
                  style={{ backgroundColor: scanResult.tier.color }}
                >
                  ★ {scanResult.tier.name}
                </span>
              )}
            </div>

            {/* Big action button */}
            <button
              onClick={handleQuickAdd}
              className="w-full bg-green-500 hover:bg-green-400 text-white text-2xl font-black py-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-green-500/25"
            >
              {isStamps ? "✓ AGREGAR SELLO" : "+ SUMAR PUNTO"}
            </button>

            <button onClick={reset} className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
              ← Escanear otro
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {state === "success" && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-28 h-28 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-4xl font-black text-green-400">{feedback}</p>
            <p className="text-sm text-gray-500">Volviendo al escáner...</p>
            {/* Progress bar for auto-reset */}
            <div className="w-48 mx-auto bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full animate-shrink" />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink 3s linear forwards;
        }
      `}</style>
    </div>
  );
}
