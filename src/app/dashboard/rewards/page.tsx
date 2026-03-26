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

const typeLabels: Record<string, string> = {
  discount: "Descuento",
  freebie: "Gratis",
  upgrade: "Mejora",
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    pointsRequired: "",
    rewardType: "freebie",
    maxRedemptions: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = async () => {
    setLoading(true);
    const res = await fetch("/api/rewards").then((r) => r.json());
    if (res.success) setRewards(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchRewards(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        pointsRequired: parseInt(form.pointsRequired),
        rewardType: form.rewardType,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : undefined,
      }),
    }).then((r) => r.json());

    if (res.success) {
      setShowForm(false);
      setForm({ name: "", description: "", pointsRequired: "", rewardType: "freebie", maxRedemptions: "" });
      fetchRewards();
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Desactivar esta recompensa?")) return;
    await fetch(`/api/rewards/${id}`, { method: "DELETE" });
    fetchRewards();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recompensas</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Nueva recompensa
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Nueva recompensa</h3>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tipo</label>
                <select
                  value={form.rewardType}
                  onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="freebie">Gratis</option>
                  <option value="discount">Descuento</option>
                  <option value="upgrade">Mejora</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Descripción</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Puntos requeridos *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.pointsRequired}
                  onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Máx. canjes (vacío = ilimitado)</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxRedemptions}
                  onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de recompensas */}
      <div className="grid gap-4">
        {loading ? (
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
                  <p className="text-xs text-gray-400">puntos</p>
                </div>
                {r.isActive && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-gray-400 hover:text-red-500 text-sm"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
