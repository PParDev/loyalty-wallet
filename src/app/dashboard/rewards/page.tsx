"use client";

import { useEffect, useState } from "react";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  pointsRequired: number;
  rewardType: string;
  maxRedemptions: number | null;
  isActive: boolean;
}

interface Tier {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  benefits: string | null;
  multiplier: number;
}

const typeLabels: Record<string, string> = {
  discount: "Descuento",
  freebie: "Gratis",
  upgrade: "Mejora",
};

const TIER_PRESET_COLORS = [
  { label: "Bronce", color: "#CD7F32" },
  { label: "Plata", color: "#A8A9AD" },
  { label: "Oro", color: "#FFD700" },
  { label: "Diamante", color: "#B9F2FF" },
  { label: "Platino", color: "#E5E4E2" },
];

export default function RewardsPage() {
  const [tab, setTab] = useState<"rewards" | "tiers">("rewards");

  // --- Recompensas ---
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(true);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    pointsRequired: "",
    rewardType: "freebie",
    maxRedemptions: "",
  });
  const [savingReward, setSavingReward] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);

  // --- Niveles ---
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [showTierForm, setShowTierForm] = useState(false);
  const [tierForm, setTierForm] = useState({
    name: "",
    minPoints: "",
    color: "#CD7F32",
    benefits: "",
    multiplier: "1.0",
  });
  const [savingTier, setSavingTier] = useState(false);
  const [tierError, setTierError] = useState<string | null>(null);

  const fetchRewards = async () => {
    setLoadingRewards(true);
    const res = await fetch("/api/rewards").then((r) => r.json());
    if (res.success) setRewards(res.data);
    setLoadingRewards(false);
  };

  const fetchTiers = async () => {
    setLoadingTiers(true);
    const res = await fetch("/api/tiers").then((r) => r.json());
    if (res.success) setTiers(res.data);
    setLoadingTiers(false);
  };

  useEffect(() => {
    fetchRewards();
    fetchTiers();
  }, []);

  // --- Handlers de recompensas ---
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReward(true);
    setRewardError(null);

    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: rewardForm.name,
        description: rewardForm.description || undefined,
        pointsRequired: parseInt(rewardForm.pointsRequired),
        rewardType: rewardForm.rewardType,
        maxRedemptions: rewardForm.maxRedemptions ? parseInt(rewardForm.maxRedemptions) : undefined,
      }),
    }).then((r) => r.json());

    if (res.success) {
      setShowRewardForm(false);
      setRewardForm({ name: "", description: "", pointsRequired: "", rewardType: "freebie", maxRedemptions: "" });
      fetchRewards();
    } else {
      setRewardError(res.error);
    }
    setSavingReward(false);
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm("¿Desactivar esta recompensa?")) return;
    await fetch(`/api/rewards/${id}`, { method: "DELETE" });
    fetchRewards();
  };

  // --- Handlers de niveles ---
  const handleCreateTier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTier(true);
    setTierError(null);

    const res = await fetch("/api/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tierForm.name,
        minPoints: parseInt(tierForm.minPoints),
        color: tierForm.color,
        benefits: tierForm.benefits || undefined,
        multiplier: parseFloat(tierForm.multiplier),
      }),
    }).then((r) => r.json());

    if (res.success) {
      setShowTierForm(false);
      setTierForm({ name: "", minPoints: "", color: "#CD7F32", benefits: "", multiplier: "1.0" });
      fetchTiers();
    } else {
      setTierError(res.error);
    }
    setSavingTier(false);
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm("¿Eliminar este nivel?")) return;
    await fetch(`/api/tiers/${id}`, { method: "DELETE" });
    fetchTiers();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recompensas y Niveles</h2>
        <button
          onClick={() => tab === "rewards" ? setShowRewardForm(true) : setShowTierForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + {tab === "rewards" ? "Nueva recompensa" : "Nuevo nivel"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white mb-6 w-fit">
        <button
          onClick={() => setTab("rewards")}
          className={`px-5 py-2 text-sm font-medium transition-colors ${tab === "rewards" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          Recompensas
        </button>
        <button
          onClick={() => setTab("tiers")}
          className={`px-5 py-2 text-sm font-medium transition-colors ${tab === "tiers" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
        >
          Niveles / Tiers
        </button>
      </div>

      {/* ─── Tab: Recompensas ─── */}
      {tab === "rewards" && (
        <div className="max-w-2xl space-y-4">
          {showRewardForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Nueva recompensa</h3>
              {rewardError && <p className="text-red-500 text-sm mb-3">{rewardError}</p>}
              <form onSubmit={handleCreateReward} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label>
                    <input
                      required
                      value={rewardForm.name}
                      onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Tipo</label>
                    <select
                      value={rewardForm.rewardType}
                      onChange={(e) => setRewardForm({ ...rewardForm, rewardType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="freebie">Gratis</option>
                      <option value="discount">Descuento</option>
                      <option value="upgrade">Mejora</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
                  <input
                    value={rewardForm.description}
                    onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Puntos / sellos requeridos *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={rewardForm.pointsRequired}
                      onChange={(e) => setRewardForm({ ...rewardForm, pointsRequired: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Máx. canjes (vacío = ilimitado)</label>
                    <input
                      type="number"
                      min="1"
                      value={rewardForm.maxRedemptions}
                      onChange={(e) => setRewardForm({ ...rewardForm, maxRedemptions: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={savingReward} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                    {savingReward ? "Guardando..." : "Guardar"}
                  </button>
                  <button type="button" onClick={() => setShowRewardForm(false)} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadingRewards ? (
            <p className="text-gray-400">Cargando...</p>
          ) : rewards.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No hay recompensas. Crea la primera.
            </div>
          ) : (
            rewards.map((r) => (
              <div key={r.id} className={`bg-white rounded-xl border p-5 flex items-center justify-between ${r.isActive ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{r.name}</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                      {typeLabels[r.rewardType] ?? r.rewardType}
                    </span>
                  </div>
                  {r.description && <p className="text-sm text-gray-500 mt-0.5">{r.description}</p>}
                  {r.maxRedemptions && (
                    <p className="text-xs text-gray-400 mt-1">Máx. {r.maxRedemptions} canjes</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-500">{r.pointsRequired}</p>
                    <p className="text-xs text-gray-400">pts / sellos</p>
                  </div>
                  {r.isActive && (
                    <button onClick={() => handleDeleteReward(r.id)} className="text-gray-400 hover:text-red-500 text-sm">
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Tab: Niveles ─── */}
      {tab === "tiers" && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">¿Cómo funcionan los niveles?</p>
            <p>Los niveles se otorgan según los <strong>puntos totales históricos</strong> del cliente (nunca bajan). Cada nivel puede tener un multiplicador de puntos para premiar a los clientes más fieles.</p>
            <p className="mt-1 text-xs">Ejemplo: Bronce (0 pts), Plata (500 pts × 1.2), Oro (1500 pts × 1.5)</p>
          </div>

          {showTierForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Nuevo nivel</h3>
              {tierError && <p className="text-red-500 text-sm mb-3">{tierError}</p>}
              <form onSubmit={handleCreateTier} className="space-y-3">
                {/* Presets de color */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Color del nivel</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {TIER_PRESET_COLORS.map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setTierForm({ ...tierForm, color: p.color, name: tierForm.name || p.label })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${tierForm.color === p.color ? "border-gray-900 scale-105" : "border-transparent"}`}
                        style={{ backgroundColor: p.color, color: "#111" }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tierForm.color}
                      onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                    />
                    <input
                      value={tierForm.color}
                      onChange={(e) => setTierForm({ ...tierForm, color: e.target.value })}
                      maxLength={7}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-base font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Nombre *</label>
                    <input
                      required
                      value={tierForm.name}
                      onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                      placeholder="Bronce, Plata, Oro..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Puntos mínimos históricos *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={tierForm.minPoints}
                      onChange={(e) => setTierForm({ ...tierForm, minPoints: e.target.value })}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Multiplicador de puntos</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={tierForm.multiplier}
                      onChange={(e) => setTierForm({ ...tierForm, multiplier: e.target.value })}
                      className="w-28 border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-500">× puntos por visita</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">1.0 = normal, 1.5 = 50% extra, 2.0 = el doble</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Beneficios (texto visible al cliente)</label>
                  <input
                    value={tierForm.benefits}
                    onChange={(e) => setTierForm({ ...tierForm, benefits: e.target.value })}
                    placeholder="Ej: 50% extra de puntos + prioridad en atención"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Preview del badge */}
                {tierForm.name && (
                  <div className="flex items-center gap-2 py-2">
                    <span className="text-xs text-gray-500">Vista previa:</span>
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-gray-900"
                      style={{ backgroundColor: tierForm.color }}
                    >
                      ★ {tierForm.name}
                    </span>
                    {parseFloat(tierForm.multiplier) > 1 && (
                      <span className="text-xs text-gray-500">× {tierForm.multiplier} puntos</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={savingTier} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                    {savingTier ? "Guardando..." : "Guardar nivel"}
                  </button>
                  <button type="button" onClick={() => setShowTierForm(false)} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadingTiers ? (
            <p className="text-gray-400">Cargando...</p>
          ) : tiers.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <p>Sin niveles configurados.</p>
              <p className="text-sm mt-1">Crea al menos 2 niveles para activar el sistema (ej: Bronce y Oro).</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tiers.map((t, i) => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-gray-900 shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{t.name}</h3>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-gray-900"
                        style={{ backgroundColor: t.color }}
                      >
                        ★ {t.name}
                      </span>
                      {t.multiplier > 1 && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          × {t.multiplier} pts
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">Desde <strong>{t.minPoints.toLocaleString()}</strong> puntos históricos</p>
                    {t.benefits && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.benefits}</p>}
                  </div>
                  <button onClick={() => handleDeleteTier(t.id)} className="text-gray-400 hover:text-red-500 text-sm shrink-0">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
