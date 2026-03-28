"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
  totalCards: number;
}

interface Stats {
  totalBusinesses: number;
  activeBusinesses: number;
  totalCards: number;
  totalCustomers: number;
}

export default function AdminPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/businesses").then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
    ]).then(([bRes, sRes]) => {
      if (bRes.success) setBusinesses(bRes.data);
      if (sRes.success) setStats(sRes.data);
      setLoading(false);
    });
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    }).then((r) => r.json());

    if (res.success) {
      setBusinesses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: !current } : b))
      );
    }
  };

  const filtered = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.ownerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" || (filter === "active" ? b.isActive : !b.isActive);
    return matchesSearch && matchesFilter;
  });

  const categoryLabel: Record<string, string> = {
    cafeteria: "Cafetería",
    barberia: "Barbería",
    restaurante: "Restaurante",
    farmacia: "Farmacia",
    lavanderia: "Lavandería",
    otro: "Otro",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de administración</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Negocios totales", value: stats.totalBusinesses },
            { label: "Negocios activos", value: stats.activeBusinesses },
            { label: "Tarjetas emitidas", value: stats.totalCards },
            { label: "Clientes registrados", value: stats.totalCustomers },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, correo o slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-base text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : "Suspendidos"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3 hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 hidden md:table-cell">Tarjetas</th>
                <th className="px-4 py-3 hidden lg:table-cell">Registro</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-10">
                    No hay negocios
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.ownerEmail ?? "—"}</p>
                    <p className="text-xs text-gray-600">/r/{b.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-300">
                    {categoryLabel[b.category] ?? b.category}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-300">
                    {b.totalCards}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-400">
                    {formatDistanceToNow(new Date(b.createdAt), { locale: es, addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        b.isActive
                          ? "bg-green-900/50 text-green-400"
                          : "bg-red-900/50 text-red-400"
                      }`}
                    >
                      {b.isActive ? "Activo" : "Suspendido"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(b.id, b.isActive)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        b.isActive
                          ? "bg-red-900/40 text-red-400 hover:bg-red-900/70"
                          : "bg-green-900/40 text-green-400 hover:bg-green-900/70"
                      }`}
                    >
                      {b.isActive ? "Suspender" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
