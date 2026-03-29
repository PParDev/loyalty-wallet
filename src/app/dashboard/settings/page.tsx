"use client";

import { useEffect, useState } from "react";
import type { BusinessLink } from "@/types";

interface ProgramData {
  name: string;
  cardBgColor: string;
  cardTextColor: string;
  pointsPerVisit: number;
  pointsPerCurrency: number;
}

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
  links: BusinessLink[];
  loyaltyPrograms: ProgramData[];
}

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "text-sm font-medium text-gray-700 block mb-1";

export default function SettingsPage() {
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [form, setForm] = useState<{
    name: string;
    category: string;
    description: string;
    logoUrl: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    latitude: string;
    longitude: string;
    geoRadiusMeters: number;
    links: BusinessLink[];
    programName: string;
    cardBgColor: string;
    cardTextColor: string;
    pointsPerVisit: number;
    pointsPerCurrency: number;
  }>({
    name: "", category: "", description: "", logoUrl: "", phone: "", email: "",
    address: "", city: "", latitude: "", longitude: "", geoRadiusMeters: 200,
    links: [], programName: "", cardBgColor: "#1a1a2e", cardTextColor: "#ffffff",
    pointsPerVisit: 1, pointsPerCurrency: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const b: BusinessData = res.data;
          setBusiness(b);
          const prog = b.loyaltyPrograms?.[0];
          setForm({
            name: b.name,
            category: b.category,
            description: b.description ?? "",
            logoUrl: b.logoUrl ?? "",
            phone: b.phone ?? "",
            email: b.email ?? "",
            address: b.address ?? "",
            city: b.city ?? "",
            latitude: b.latitude ? String(b.latitude) : "",
            longitude: b.longitude ? String(b.longitude) : "",
            geoRadiusMeters: b.geoRadiusMeters,
            links: Array.isArray(b.links) ? b.links : [],
            programName: prog?.name ?? "",
            cardBgColor: prog?.cardBgColor ?? "#1a1a2e",
            cardTextColor: prog?.cardTextColor ?? "#ffffff",
            pointsPerVisit: prog?.pointsPerVisit ?? 1,
            pointsPerCurrency: prog?.pointsPerCurrency ?? 0,
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

    const payload = {
      ...form,
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
    };

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

  const addLink = () => {
    if (form.links.length >= 5) return;
    setForm({
      ...form,
      links: [...form.links, { id: crypto.randomUUID(), label: "", url: "" }],
    });
  };

  const updateLink = (id: string, field: "label" | "url", value: string) => {
    setForm({
      ...form,
      links: form.links.map((l) => l.id === id ? { ...l, [field]: value } : l),
    });
  };

  const removeLink = (id: string) => {
    setForm({ ...form, links: form.links.filter((l) => l.id !== id) });
  };

  if (loading) return <div className="p-6 text-gray-400">Cargando...</div>;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const registrationUrl = business ? `${appUrl}/r/${business.slug}` : "";

  const cardPreviewStyle = {
    backgroundColor: form.cardBgColor,
    color: form.cardTextColor,
  };

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

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Datos del negocio ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Datos del negocio</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre del negocio</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Categoría</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
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
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>URL del logo</label>
            <input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="311 123 4567" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Correo del negocio</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="negocio@correo.com" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Av. México 123" className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Latitud GPS</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="21.5045" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Longitud GPS</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-104.8945" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Radio geofencing (m)</label>
              <input type="number" min="50" max="5000" value={form.geoRadiusMeters} onChange={(e) => setForm({ ...form, geoRadiusMeters: parseInt(e.target.value) })} className={inputClass} />
            </div>
          </div>
        </section>

        {/* ── Programa de lealtad ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Programa de lealtad</h3>

          <div>
            <label className={labelClass}>Nombre del programa</label>
            <input value={form.programName} onChange={(e) => setForm({ ...form, programName: e.target.value })} placeholder="Club de Lealtad" className={inputClass} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Puntos por visita</label>
              <input type="number" min="1" value={form.pointsPerVisit} onChange={(e) => setForm({ ...form, pointsPerVisit: parseInt(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Puntos por cada $1 MXN gastado</label>
              <input type="number" min="0" step="0.1" value={form.pointsPerCurrency} onChange={(e) => setForm({ ...form, pointsPerCurrency: parseFloat(e.target.value) })} placeholder="0 = desactivado" className={inputClass} />
            </div>
          </div>

          {/* Colores con preview */}
          <div>
            <label className={labelClass}>Diseño de la tarjeta</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Color de fondo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.cardBgColor}
                    onChange={(e) => setForm({ ...form, cardBgColor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    value={form.cardBgColor}
                    onChange={(e) => setForm({ ...form, cardBgColor: e.target.value })}
                    placeholder="#1a1a2e"
                    maxLength={7}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1.5">Color de texto</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.cardTextColor}
                    onChange={(e) => setForm({ ...form, cardTextColor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    value={form.cardTextColor}
                    onChange={(e) => setForm({ ...form, cardTextColor: e.target.value })}
                    placeholder="#ffffff"
                    maxLength={7}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* Preview de la tarjeta */}
            <div
              className="rounded-2xl p-5 shadow-md"
              style={cardPreviewStyle}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-base font-bold opacity-90">{form.name || "Tu negocio"}</p>
                  <p className="text-xs opacity-60 mt-0.5">{form.programName || "Programa de lealtad"}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">150</p>
                  <p className="text-xs opacity-60">puntos</p>
                </div>
              </div>
              <div className="flex justify-center bg-white bg-opacity-20 rounded-xl p-3 mb-3">
                <div className="w-20 h-20 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
                  <span className="text-xs opacity-60">QR</span>
                </div>
              </div>
              <p className="text-center text-sm font-medium opacity-80">Vista previa</p>
            </div>
          </div>
        </section>

        {/* ── Links en la tarjeta ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Botones en la tarjeta wallet</h3>
              <p className="text-xs text-gray-500 mt-0.5">Aparecen como botones en Google Wallet. Máximo 5.</p>
            </div>
            <button
              type="button"
              onClick={addLink}
              disabled={form.links.length >= 5}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-40 border border-indigo-200 rounded-lg px-3 py-1.5"
            >
              + Agregar
            </button>
          </div>

          {form.links.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              Sin botones configurados. Puedes agregar WhatsApp, Instagram, sitio web, etc.
            </p>
          )}

          {form.links.map((link, i) => (
            <div key={link.id} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={link.label}
                  onChange={(e) => updateLink(link.id, "label", e.target.value)}
                  placeholder={`Etiqueta (ej: WhatsApp, Instagram)`}
                  className={inputClass}
                />
                <input
                  value={link.url}
                  onChange={(e) => updateLink(link.id, "url", e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                className="mt-1 text-gray-400 hover:text-red-500 transition-colors p-2"
                title={`Eliminar link ${i + 1}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {form.links.length > 0 && (
            <p className="text-xs text-gray-400">
              Tip: puedes poner <code className="bg-gray-100 px-1 rounded">https://wa.me/52311XXXXXXX</code> para WhatsApp directo.
            </p>
          )}
        </section>

        <div className="pb-6">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
