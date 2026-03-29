"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CardScanResult } from "@/types";

const QrScanner = dynamic(() => import("@/components/scan/QrScanner"), { ssr: false });

type ScanState = "scanning" | "result" | "adding_points" | "redeeming";

function StampGrid({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="text-xl leading-none">{i < current ? "✅" : "⬜"}</span>
      ))}
    </div>
  );
}

function TierBadge({ tier }: { tier: NonNullable<CardScanResult["tier"]> }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-gray-900"
      style={{ backgroundColor: tier.color }}
    >
      ★ {tier.name}
      {tier.multiplier > 1 && <span className="opacity-70">× {tier.multiplier}</span>}
    </span>
  );
}

export default function ScanPage() {
  const [state, setState] = useState<ScanState>("scanning");
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [scanMode, setScanMode] = useState<"camera" | "manual" | "phone">("camera");
  const [loadingSearch, setLoadingSearch] = useState(false);

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
    setLoadingSearch(true);
    setError(null);
    const res = await fetch(`/api/scan?phone=${encodeURIComponent(phoneInput.trim())}`).then((r) => r.json());
    setLoadingSearch(false);
    if (res.success) {
      setScanResult(res.data);
      setState("result");
    } else {
      setError(res.error);
    }
  };

  const handleAddPoints = async () => {
    if (!scanResult) return;
    const isStamps = scanResult.program.programType === "stamps";
    const points = (!isStamps && pointsInput) ? parseInt(pointsInput) : undefined;
    const amountSpent = (!isStamps && amountInput) ? parseFloat(amountInput) : undefined;

    const res = await fetch(`/api/cards/${scanResult.cardId}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points, amountSpent }),
    }).then((r) => r.json());

    if (res.success) {
      const label = isStamps ? "sello" : "puntos";
      const added = isStamps ? "1 sello" : `+${res.data.pointsAdded} puntos`;
      let feedbackMsg = `${added} sumado. Total: ${res.data.newPoints} ${label}`;
      if (res.data.pointsExpired) feedbackMsg = `⚠️ Puntos vencidos reiniciados. ${feedbackMsg}`;
      setFeedback(feedbackMsg);
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    await handleScan(manualInput.trim());
    setManualInput("");
  };

  const reset = () => {
    setState("scanning");
    setScanResult(null);
    setError(null);
    setFeedback(null);
    setPointsInput("");
    setAmountInput("");
    setManualInput("");
    setPhoneInput("");
  };

  // Aviso de expiración próxima (menos de 7 días)
  const expirationWarning = (() => {
    if (!scanResult?.pointsExpiresAt) return null;
    const daysLeft = Math.ceil((new Date(scanResult.pointsExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { level: "danger", text: "¡Los puntos de este cliente están vencidos! Se reiniciarán al dar el próximo sello/punto." };
    if (daysLeft <= 7) return { level: "warning", text: `Los puntos vencen en ${daysLeft} día${daysLeft === 1 ? "" : "s"}.` };
    return null;
  })();

  const isStamps = scanResult?.program.programType === "stamps";

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
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
        <div className="space-y-4">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            {(["camera", "phone", "manual"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setScanMode(mode)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${scanMode === mode ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {mode === "camera" ? "Cámara" : mode === "phone" ? "Teléfono" : "Código"}
              </button>
            ))}
          </div>

          {scanMode === "camera" && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <QrScanner onScan={handleScan} />
              <div className="p-4 text-center text-sm text-gray-500">
                Apunta la cámara al QR de la tarjeta del cliente
              </div>
            </div>
          )}

          {scanMode === "phone" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4">Busca al cliente por su número de teléfono</p>
              <form onSubmit={handlePhoneSearch} className="space-y-3">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="311 123 4567"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!phoneInput.trim() || loadingSearch}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loadingSearch ? "Buscando..." : "Buscar cliente"}
                </button>
              </form>
            </div>
          )}

          {scanMode === "manual" && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-4">
                Ingresa el código de la tarjeta (<span className="font-mono text-gray-700">LW:...</span>)
              </p>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="LW:550e8400-..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 disabled:opacity-50"
                >
                  Buscar tarjeta
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {(state === "result" || state === "adding_points" || state === "redeeming") && scanResult && (
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Aviso de expiración */}
          {expirationWarning && (
            <div className={`px-4 py-2.5 text-xs font-medium ${expirationWarning.level === "danger" ? "bg-red-50 text-red-700 border-b border-red-100" : "bg-amber-50 text-amber-700 border-b border-amber-100"}`}>
              {expirationWarning.text}
            </div>
          )}

          {/* Info del cliente */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{scanResult.customer.name}</h3>
                <p className="text-sm text-gray-500">{scanResult.customer.phone}</p>
                {scanResult.tier && (
                  <div className="mt-1.5">
                    <TierBadge tier={scanResult.tier} />
                  </div>
                )}
              </div>
              <div className="text-right">
                {isStamps ? (
                  <>
                    <p className="text-3xl font-bold text-indigo-600">{scanResult.currentPoints}</p>
                    <p className="text-xs text-gray-500">/ {scanResult.program.stampsRequired} sellos</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-indigo-600">{scanResult.currentPoints}</p>
                    <p className="text-xs text-gray-500">puntos</p>
                  </>
                )}
              </div>
            </div>

            {/* Grid de sellos */}
            {isStamps && (
              <StampGrid current={scanResult.currentPoints} total={scanResult.program.stampsRequired} />
            )}

            {/* Barra de progreso (solo puntos) */}
            {!isStamps && (() => {
              const allRewards = [...scanResult.availableRewards].sort((a, b) => a.pointsRequired - b.pointsRequired);
              const nextReward = allRewards.find((r) => r.pointsRequired > scanResult.currentPoints);
              if (!nextReward) return null;
              const prevThreshold = allRewards.filter((r) => r.pointsRequired <= scanResult.currentPoints).at(-1)?.pointsRequired ?? 0;
              const progress = Math.min(100, Math.round(((scanResult.currentPoints - prevThreshold) / (nextReward.pointsRequired - prevThreshold)) * 100));
              return (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Próxima: <span className="font-medium text-gray-700">{nextReward.name}</span></span>
                    <span>{scanResult.currentPoints}/{nextReward.pointsRequired} pts</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              );
            })()}

            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {scanResult.totalVisits} visitas totales
            </div>

            {scanResult.availableRewards.length > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-200">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {scanResult.availableRewards.length} recompensa{scanResult.availableRewards.length > 1 ? "s" : ""} disponible{scanResult.availableRewards.length > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {state === "result" && (
            <div className="p-4 space-y-3">
              <button
                onClick={() => setState("adding_points")}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
              >
                {isStamps ? "✅ Dar sello" : "+ Sumar puntos"}
              </button>
              {scanResult.availableRewards.length > 0 && (
                <button
                  onClick={() => setState("redeeming")}
                  className="w-full bg-amber-500 text-white py-3 rounded-lg font-medium hover:bg-amber-600"
                >
                  Canjear recompensa
                </button>
              )}
              <button onClick={reset} className="w-full text-gray-500 py-2 text-sm hover:text-gray-700">
                Escanear otro
              </button>
            </div>
          )}

          {state === "adding_points" && (
            <div className="p-4 space-y-3">
              {isStamps ? (
                <>
                  <h4 className="font-medium text-gray-900">Dar sello</h4>
                  <p className="text-sm text-gray-500">
                    Se dará 1 sello al cliente. Llevará <strong>{scanResult.currentPoints + 1}</strong> de <strong>{scanResult.program.stampsRequired}</strong>.
                  </p>
                  {scanResult.currentPoints + 1 >= scanResult.program.stampsRequired && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 font-medium">
                      🎉 ¡Con este sello el cliente completa su tarjeta!
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h4 className="font-medium text-gray-900">Sumar puntos</h4>
                  {scanResult.program.pointsPerCurrency > 0 && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Monto de compra ($MXN)</label>
                      <input
                        type="number"
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder="Ej: 150.00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Puntos a sumar (default: {scanResult.program.pointsPerVisit})
                      {scanResult.tier && scanResult.tier.multiplier > 1 && (
                        <span className="ml-1 font-medium" style={{ color: scanResult.tier.color }}>
                          × {scanResult.tier.multiplier} ({scanResult.tier.name})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      placeholder={String(scanResult.program.pointsPerVisit)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
              <button onClick={handleAddPoints} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700">
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
                    <span className="text-sm text-amber-600 font-semibold">{r.pointsRequired} {isStamps ? "sellos" : "pts"}</span>
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
