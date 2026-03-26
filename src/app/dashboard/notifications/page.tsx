"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  sentCount: number;
  sentAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  sent: "Enviada",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "push", scheduledAt: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await fetch("/api/notifications").then((r) => r.json());
    if (res.success) setNotifications(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        message: form.message,
        type: form.scheduledAt ? "scheduled" : "push",
        scheduledAt: form.scheduledAt || undefined,
      }),
    }).then((r) => r.json());

    if (res.success) {
      setShowForm(false);
      setForm({ title: "", message: "", type: "push", scheduledAt: "" });
      fetchNotifications();
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Nueva notificación
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Nueva notificación</h3>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Título *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={100}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Mensaje *</label>
              <textarea
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={500}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Programar para (vacío = enviar ahora)
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                {saving ? "Enviando..." : form.scheduledAt ? "Programar" : "Enviar ahora"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Sin notificaciones enviadas</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{n.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ml-4 shrink-0 ${
                  n.status === "sent" ? "bg-green-50 text-green-600" :
                  n.status === "scheduled" ? "bg-blue-50 text-blue-600" :
                  "bg-gray-50 text-gray-500"
                }`}>
                  {statusLabels[n.status] ?? n.status}
                </span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>
                  {n.sentAt
                    ? `Enviada ${format(new Date(n.sentAt), "dd MMM yyyy HH:mm", { locale: es })}`
                    : n.scheduledAt
                    ? `Programada ${format(new Date(n.scheduledAt), "dd MMM yyyy HH:mm", { locale: es })}`
                    : format(new Date(n.createdAt), "dd MMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
