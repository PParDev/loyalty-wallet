"use client";

import { useEffect, useState } from "react";
import type { DashboardStats, RecentActivity } from "@/types";

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a4 4 0 00-5.916-3.519M15 11a4 4 0 10-8 0 4 4 0 008 0zm-4 8H3v-1a4 4 0 015.916-3.519" />
  </svg>
);
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const IconGift = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a4 4 0 00-4-4 2 2 0 000 4h4zm0 0V6a4 4 0 014-4 2 2 0 010 4h-4zm-7 4h14M5 12a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2H5z" />
  </svg>
);
const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const ACTIVITY_LIMIT = 20;

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((r) => r.json())
      .then((res) => { if (res.success) setStats(res.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setActivityLoading(true);
    fetch(`/api/stats/activity?page=${activityPage}&limit=${ACTIVITY_LIMIT}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setActivity(res.data.activity);
          setActivityTotal(res.data.total);
        }
      })
      .finally(() => setActivityLoading(false));
  }, [activityPage]);

  if (loading) return <div className="p-8 text-gray-500">Cargando estadísticas...</div>;

  const totalPages = Math.ceil(activityTotal / ACTIVITY_LIMIT);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumen</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total clientes" value={stats?.totalCustomers ?? 0} icon={<IconUsers />} />
        <StatCard label="Visitas hoy" value={stats?.visitsToday ?? 0} icon={<IconCalendar />} />
        <StatCard label="Puntos canjeados (mes)" value={stats?.pointsRedeemedThisMonth ?? 0} icon={<IconGift />} />
        <StatCard label="Clientes activos (30d)" value={stats?.activeCards ?? 0} icon={<IconCheck />} />
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Actividad reciente</h3>
          <span className="text-sm text-gray-500">{activityTotal} transacciones</span>
        </div>
        <div className="divide-y divide-gray-100">
          {activityLoading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Cargando...</div>
          ) : activity.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Sin actividad registrada</div>
          ) : (
            activity.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.customerName}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <span className={`text-sm font-semibold ${item.points > 0 ? "text-green-600" : "text-red-500"}`}>
                  {item.points > 0 ? `+${item.points}` : item.points} pts
                </span>
              </div>
            ))
          )}
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex gap-2 justify-center">
            <button
              onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
              disabled={activityPage === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Página {activityPage} de {totalPages}
            </span>
            <button
              onClick={() => setActivityPage((p) => p + 1)}
              disabled={activityPage >= totalPages}
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

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
