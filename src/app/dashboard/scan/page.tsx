"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CardScanResult } from "@/types";

const QrScanner = dynamic(() => import("@/components/scan/QrScanner"), { ssr: false });

type ScanState = "scanning" | "result" | "adding_points" | "redeeming";

export default function ScanPage() {
  const [state, setState] = useState<ScanState>("scanning");
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

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

  const handleAddPoints = async () => {
    if (!scanResult) return;
    const points = pointsInput ? parseInt(pointsInput) : undefined;
    const amountSpent = amountInput ? parseFloat(amountInput) : undefined;

    const res = await fetch(`/api/cards/${scanResult.cardId}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points, amountSpent }),
    }).then((r) => r.json());

    if (res.success) {
      setFeedback(`+${res.data.pointsAdded} puntos sumados. Total: ${res.data.newPoints} pts`);
      setScanResult((prev) => prev ? { ...prev, currentPoints: res.data.newPoints } : prev);
      setState("result");
      setPointsInput("");
      setAmountInput("");
    } else {
      setError(res.error);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    if (!scanResult) return;
    const res = await fetch(`/api/cards/${scanResult.cardId}/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId }),
    }).then((r) => r.json());

    if (res.success) {
      setFeedback(`Canje exitoso: ${res.data.reward}. Puntos restantes: ${res.data.remainingPoints}`);
      setScanResult((prev) => prev ? { ...prev, currentPoints: res.data.remainingPoints } : prev);
      setState("result");
    } else {
      setError(res.error);
    }
  };

  const reset = () => {
    setState("scanning");
    setScanResult(null);
    setError(null);
    setFeedback(null);
    setPointsInput("");
    setAmountInput("");
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Escanear QR</h2>

      {feedback && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {feedback}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {state === "scanning" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <QrScanner onScan={handleScan} />
          <div className="p-4 text-center text-sm text-gray-500">
            Apunta la cámara al QR de la tarjeta del cliente
          </div>
        </div>
      )}

      {(state === "result" || state === "adding_points" || state === "redeeming") && scanResult && (
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Info del cliente */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-lg">{scanResult.customer.name}</h3>
            <p className="text-sm text-gray-500">{scanResult.customer.phone}</p>
            <div className="mt-3 flex gap-4">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{scanResult.currentPoints}</p>
                <p className="text-xs text-gray-500">puntos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-700">{scanResult.totalVisits}</p>
                <p className="text-xs text-gray-500">visitas</p>
              </div>
            </div>
          </div>

          {state === "result" && (
            <div className="p-4 space-y-3">
              <button
                onClick={() => setState("adding_points")}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
              >
                + Sumar puntos
              </button>
              {scanResult.availableRewards.length > 0 && (
                <button
                  onClick={() => setState("redeeming")}
                  className="w-full bg-amber-500 text-white py-3 rounded-lg font-medium hover:bg-amber-600"
                >
                  Canjear recompensa ({scanResult.availableRewards.length} disponibles)
                </button>
              )}
              <button onClick={reset} className="w-full text-gray-500 py-2 text-sm hover:text-gray-700">
                Escanear otro QR
              </button>
            </div>
          )}

          {state === "adding_points" && (
            <div className="p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Sumar puntos</h4>
              {scanResult.program.pointsPerCurrency > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Monto de compra ($MXN)</label>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Ej: 150.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Puntos a sumar (default: {scanResult.program.pointsPerVisit})
                </label>
                <input
                  type="number"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  placeholder={String(scanResult.program.pointsPerVisit)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button onClick={handleAddPoints} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium">
                Confirmar
              </button>
              <button onClick={() => setState("result")} className="w-full text-gray-500 py-2 text-sm">
                Cancelar
              </button>
            </div>
          )}

          {state === "redeeming" && (
            <div className="p-4 space-y-2">
              <h4 className="font-medium text-gray-900 mb-3">Recompensas disponibles</h4>
              {scanResult.availableRewards.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRedeem(r.id)}
                  className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{r.name}</span>
                    <span className="text-sm text-amber-600 font-semibold">{r.pointsRequired} pts</span>
                  </div>
                  {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                </button>
              ))}
              <button onClick={() => setState("result")} className="w-full text-gray-500 py-2 text-sm mt-2">
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
