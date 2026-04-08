"use client";

import { useEffect, useState } from "react";
import type { DashboardStats, RecentActivity } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const [insights, setInsights] = useState<Insight[]>([]);

  type Insight = { id: string; type: "warning" | "success" | "info" | "danger"; icon: string; title: string; description: string; value?: string };

  const ACTIVITY_LIMIT = 20;

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((r) => r.json())
      .then((res) => { if (res.success) setStats(res.data); })
      .finally(() => setLoading(false));
    
    fetch("/api/stats/insights")
      .then((r) => r.json())
      .then((res) => { if (res.success) setInsights(res.data.insights ?? []); });
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

  const insightColors = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-green-50 border-green-200 text-green-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    danger: "bg-red-50 border-red-200 text-red-800",
  };

  const InsightIconMap: Record<string, React.ReactNode> = {
    "alert-circle": <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    "chart-bar": <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    "arrow-trending-up": <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    "arrow-trending-down": <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>,
    "star": <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    "gift": <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a4 4 0 00-4-4 2 2 0 000 4h4zm0 0V6a4 4 0 014-4 2 2 0 010 4h-4zm-7 4h14M5 12a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2H5z" /></svg>,
  };

  const dummyChartData = [
    { name: 'Ene', visitas: 65, altas: 28 },
    { name: 'Feb', visitas: 85, altas: 35 },
    { name: 'Mar', visitas: 120, altas: 45 },
    { name: 'Abr', visitas: 140, altas: 60 },
    { name: 'May', visitas: 180, altas: 70 },
  ];

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Resumen Analytics</h2>
        <a href="/api/stats/export" download className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Exportar Transacciones a CSV
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total clientes" value={stats?.totalCustomers ?? 0} icon={<IconUsers />} />
        <StatCard label="Visitas hoy" value={stats?.visitsToday ?? 0} icon={<IconCalendar />} />
        <StatCard label="Puntos canjeados (mes)" value={stats?.pointsRedeemedThisMonth ?? 0} icon={<IconGift />} />
        <StatCard label="Clientes activos (30d)" value={stats?.activeCards ?? 0} icon={<IconCheck />} />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`rounded-xl border p-4 ${insightColors[insight.type]}`}
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-current opacity-80">{InsightIconMap[insight.icon] || insight.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{insight.title}</p>
                    <p className="text-xs opacity-75 mt-0.5">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico Tendencias Muestra */}
      <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Tendencia de Visitas y Retención</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dummyChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Line type="monotone" dataKey="visitas" name="Visitas Totales" stroke="#4F46E5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              <Line type="monotone" dataKey="altas" name="Altas Nuevas" stroke="#10B981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
