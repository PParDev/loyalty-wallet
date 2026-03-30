"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  currentPoints: number;
  totalVisits: number;
  lastVisit: string | null;
  cardId: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", search });
    const res = await fetch(`/api/customers?${params}`).then((r) => r.json());
    if (res.success) {
      setCustomers(res.data.customers);
      setTotal(res.data.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o correo..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Teléfono</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Puntos</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Visitas</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Última visita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Cargando...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Sin clientes</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-indigo-600">{Math.floor(c.currentPoints)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.totalVisits}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.lastVisit
                      ? format(new Date(c.lastVisit), "dd MMM yyyy", { locale: es })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {total > 20 && (
          <div className="px-4 py-3 border-t border-gray-200 flex gap-2 justify-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Página {page} de {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
