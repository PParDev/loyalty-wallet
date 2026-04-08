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

interface HistoryTransaction {
  id: string;
  type: string;
  points: number;
  amountSpent: string | null;
  description: string | null;
  createdAt: string;
}

interface CustomerHistory {
  customer: { id: string; name: string; phone: string; email: string | null };
  card: {
    id: string;
    currentPoints: number;
    totalPointsEarned: number;
    totalVisits: number;
    lastVisit: string | null;
    createdAt: string;
  };
  transactions: HistoryTransaction[];
  total: number;
  page: number;
  limit: number;
}

const typeLabels: Record<string, string> = {
  earn: "Ganó puntos",
  redeem: "Canjeó recompensa",
  adjust: "Ajuste",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // History modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const openHistory = useCallback(async (customerId: string, p = 1) => {
    setSelectedId(customerId);
    setHistoryPage(p);
    setHistoryLoading(true);
    const res = await fetch(`/api/customers/${customerId}/history?page=${p}&limit=20`).then((r) => r.json());
    if (res.success) setHistory(res.data);
    setHistoryLoading(false);
  }, []);

  const closeHistory = () => {
    setSelectedId(null);
    setHistory(null);
    setHistoryPage(1);
  };

  const historyTotalPages = history ? Math.ceil(history.total / history.limit) : 0;

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
                <tr
                  key={c.id}
                  onClick={() => openHistory(c.id)}
                  className="hover:bg-indigo-50 cursor-pointer transition-colors"
                >
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

      {/* History modal */}
      {selectedId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={closeHistory}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="p-6 border-b border-gray-200 flex items-start justify-between">
              {historyLoading || !history ? (
                <div className="text-gray-400 text-sm">Cargando...</div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{history.customer.name}</h3>
                  <p className="text-sm text-gray-500">{history.customer.phone}{history.customer.email ? ` · ${history.customer.email}` : ""}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <div className="text-center">
                      <p className="text-xl font-bold text-indigo-600">{Math.floor(history.card.currentPoints)}</p>
                      <p className="text-xs text-gray-500">Puntos actuales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-700">{history.card.totalVisits}</p>
                      <p className="text-xs text-gray-500">Visitas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-700">{history.card.totalPointsEarned}</p>
                      <p className="text-xs text-gray-500">Pts ganados total</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={closeHistory}
                className="text-gray-400 hover:text-gray-600 ml-4 shrink-0 p-1 rounded-md hover:bg-gray-100 transition-colors"
                title="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Transaction list */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {historyLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
              ) : !history || history.transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Sin transacciones</div>
              ) : (
                history.transactions.map((t) => (
                  <div key={t.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{typeLabels[t.type] ?? t.type}</p>
                      {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(t.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${t.points > 0 ? "text-green-600" : "text-red-500"}`}>
                      {t.points > 0 ? `+${t.points}` : t.points} pts
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {historyTotalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-200 flex gap-2 justify-center">
                <button
                  onClick={() => { openHistory(selectedId, historyPage - 1); }}
                  disabled={historyPage === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {historyPage} / {historyTotalPages}
                </span>
                <button
                  onClick={() => { openHistory(selectedId, historyPage + 1); }}
                  disabled={historyPage >= historyTotalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}

            {/* Footer info */}
            {history && (
              <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
                Cliente desde {format(new Date(history.card.createdAt), "dd MMM yyyy", { locale: es })}
                {" · "}{history.total} transacciones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
