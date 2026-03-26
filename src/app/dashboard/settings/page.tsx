"use client";

import { useEffect, useState } from "react";

interface BusinessData {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  geoRadiusMeters: number;
}

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "text-sm font-medium text-gray-700 block mb-1";

export default function SettingsPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [form, setForm] = useState<Partial<BusinessData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setBusiness(res.data);
          setForm({
            name: res.data.name,
            category: res.data.category,
            description: res.data.description ?? "",
            logoUrl: res.data.logoUrl ?? "",
            phone: res.data.phone ?? "",
            email: res.data.email ?? "",
            address: res.data.address ?? "",
            city: res.data.city ?? "",
            latitude: res.data.latitude ? String(res.data.latitude) : "",
            longitude: res.data.longitude ? String(res.data.longitude) : "",
            geoRadiusMeters: res.data.geoRadiusMeters,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const payload: Record<string, unknown> = { ...form };
    if (form.latitude) payload.latitude = parseFloat(form.latitude as string);
    if (form.longitude) payload.longitude = parseFloat(form.longitude as string);

    const res = await fetch("/api/businesses/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());

    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-gray-400">Cargando...</div>;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const registrationUrl = business ? `${appUrl}/r/${business.slug}` : "";

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h2>

      {business && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-indigo-700 mb-2">URL de registro de clientes</p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-white border border-indigo-200 rounded px-3 py-1.5 flex-1 truncate text-gray-700">
              {registrationUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(registrationUrl)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0 px-3 py-1.5 bg-white border border-indigo-200 rounded"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Cambios guardados correctamente
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre del negocio</label>
            <input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <select
              value={form.category ?? ""}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              <option value="cafeteria">Cafetería</option>
              <option value="barberia">Barbería</option>
              <option value="restaurante">Restaurante</option>
              <option value="farmacia">Farmacia</option>
              <option value="lavanderia">Lavandería</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>URL del logo</label>
          <input
            value={form.logoUrl ?? ""}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Teléfono</label>
            <input
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="311 123 4567"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Correo del negocio</label>
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="negocio@correo.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Dirección</label>
          <input
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Av. México 123"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Latitud GPS</label>
            <input
              type="number"
              step="any"
              value={form.latitude ?? ""}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              placeholder="21.5045"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Longitud GPS</label>
            <input
              type="number"
              step="any"
              value={form.longitude ?? ""}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              placeholder="-104.8945"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Radio geofencing (m)</label>
            <input
              type="number"
              min="50"
              max="5000"
              value={form.geoRadiusMeters ?? 200}
              onChange={(e) => setForm({ ...form, geoRadiusMeters: parseInt(e.target.value) })}
              placeholder="200"
              className={inputClass}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-base font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
