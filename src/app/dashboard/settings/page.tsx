"use client";

import { useEffect, useState } from "react";
import ImageUpload from "@/components/ui/ImageUpload";
import QrDownloadSection from "@/components/dashboard/QrDownloadSection";
import type { BusinessLink } from "@/types";

interface ProgramData {
  name: string;
  earningMode: string;
  cardBgColor: string;
  cardTextColor: string;
  pointsPerVisit: number;
  pointsPerCurrency: number;
  pointsExpirationDays: number | null;
  stampsRequired: number | null;
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
  heroImageUrl: string | null;
  wordmarkImageUrl: string | null;
  homepageLabel: string | null;
  homepageUrl: string | null;
  walletCallbackUrl: string | null;
  quickRegistration: boolean;
  isWhiteLabel: boolean;
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
    heroImageUrl: string;
    wordmarkImageUrl: string;
    homepageLabel: string;
    homepageUrl: string;
    walletCallbackUrl: string;
    programName: string;
    earningMode: "visit" | "amount" | "stamps";
    cardBgColor: string;
    cardTextColor: string;
    pointsPerVisit: number;
    pointsPerCurrency: number;
    pointsExpirationDays: string; // string para el input, "" = desactivado
    stampsRequired: number;
    quickRegistration: boolean;
    isWhiteLabel: boolean;
  }>({
    name: "", category: "", description: "", logoUrl: "", phone: "", email: "",
    address: "", city: "", latitude: "", longitude: "", geoRadiusMeters: 200,
    links: [], heroImageUrl: "", wordmarkImageUrl: "", homepageLabel: "", homepageUrl: "", walletCallbackUrl: "",
    programName: "", earningMode: "visit",
    cardBgColor: "#1a1a2e", cardTextColor: "#ffffff",
    pointsPerVisit: 1, pointsPerCurrency: 0,
    pointsExpirationDays: "",
    stampsRequired: 10,
    quickRegistration: false,
    isWhiteLabel: false,
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
            heroImageUrl: b.heroImageUrl ?? "",
            wordmarkImageUrl: b.wordmarkImageUrl ?? "",
            homepageLabel: b.homepageLabel ?? "",
            homepageUrl: b.homepageUrl ?? "",
            walletCallbackUrl: b.walletCallbackUrl ?? "",
            programName: prog?.name ?? "",
            earningMode: (prog?.earningMode as "visit" | "amount" | "stamps") ?? "visit",
            cardBgColor: prog?.cardBgColor ?? "#1a1a2e",
            cardTextColor: prog?.cardTextColor ?? "#ffffff",
            pointsPerVisit: prog?.pointsPerVisit ?? 1,
            pointsPerCurrency: prog?.pointsPerCurrency ?? 0,
            pointsExpirationDays: prog?.pointsExpirationDays ? String(prog.pointsExpirationDays) : "",
            stampsRequired: prog?.stampsRequired ?? 10,
            quickRegistration: (b as unknown as { quickRegistration: boolean }).quickRegistration ?? false,
            isWhiteLabel: (b as unknown as { isWhiteLabel: boolean }).isWhiteLabel ?? false,
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
      pointsExpirationDays: form.pointsExpirationDays ? parseInt(form.pointsExpirationDays) : null,
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
        <div className="mb-6">
          <QrDownloadSection slug={business.slug} />
        </div>
      )}

      {/* Quick Registration Toggle */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Registro rápido</h3>
            <p className="text-xs text-gray-500 mt-0.5">Los clientes solo necesitan su teléfono para registrarse (sin nombre ni email).</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, quickRegistration: !form.quickRegistration })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.quickRegistration ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              form.quickRegistration ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </div>

      {/* White Label Toggle */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Modo Marca Blanca (White-label)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Oculta la mención "Powered by LoyaltyWallet" de la vista del cliente.</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, isWhiteLabel: !form.isWhiteLabel })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.isWhiteLabel ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              form.isWhiteLabel ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </div>

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

          <ImageUpload
            label="Logo del negocio"
            value={form.logoUrl}
            onChange={(url) => setForm({ ...form, logoUrl: url })}
            hint="Recomendado: imagen cuadrada, fondo transparente"
          />

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

          {/* Modo de acumulación */}
          <div>
            <label className={labelClass}>¿Cómo acumulan puntos tus clientes?</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setForm({ ...form, earningMode: "visit" })}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.earningMode === "visit" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50 bg-white"}`}
              >
                Por visita
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, earningMode: "amount" })}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${form.earningMode === "amount" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50 bg-white"}`}
              >
                Por monto de compra
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {form.earningMode === "visit"
                ? "El cliente gana puntos fijos por cada visita, sin importar cuánto compre."
                : "El cliente gana puntos según el monto que gasta en cada visita."}
            </p>
          </div>

          {form.earningMode === "visit" ? (
            <div>
              <label className={labelClass}>Puntos por visita</label>
              <input type="number" min="1" value={form.pointsPerVisit} onChange={(e) => setForm({ ...form, pointsPerVisit: parseInt(e.target.value) })} className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">El cliente recibe estos puntos cada vez que el cajero registra su visita.</p>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Puntos por cada $1 MXN gastado</label>
              <input type="number" min="0.01" step="0.01" value={form.pointsPerCurrency} onChange={(e) => setForm({ ...form, pointsPerCurrency: parseFloat(e.target.value) })} placeholder="Ej: 0.5 = 1 pt por cada $2" className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">El cajero ingresa el monto de la compra y el sistema calcula los puntos automáticamente.</p>
            </div>
          )}

          {/* Expiración de puntos */}
          <div>
            <label className={labelClass}>Expiración de puntos por inactividad</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={form.pointsExpirationDays}
                onChange={(e) => setForm({ ...form, pointsExpirationDays: e.target.value })}
                placeholder="Vacío = no expiran"
                className={`${inputClass} flex-1`}
              />
              <span className="text-sm text-gray-500 shrink-0">días</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Si el cliente no visita en este periodo, sus puntos se reinician. Vacío = no expiran nunca.
            </p>
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

        {/* ── Google Wallet — clase ── */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Google Wallet — diseño avanzado</h3>
            <p className="text-xs text-gray-500 mt-0.5">Campos opcionales que aparecen en la clase de la tarjeta dentro de Google Wallet.</p>
          </div>

          <div>
            <label className={labelClass}>Hero image (URL)</label>
            <input
              value={form.heroImageUrl}
              onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
              placeholder="https://... (imagen de banner en la tarjeta)"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Imagen panorámica que aparece en la parte superior de la tarjeta. Recomendado: 1032×336 px.</p>
          </div>

          <div>
            <label className={labelClass}>Wordmark image (URL)</label>
            <input
              value={form.wordmarkImageUrl}
              onChange={(e) => setForm({ ...form, wordmarkImageUrl: e.target.value })}
              placeholder="https://... (logotipo en texto)"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Logotipo en formato texto/wordmark. Recomendado: fondo transparente, alto contraste.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Etiqueta del enlace principal</label>
              <input
                value={form.homepageLabel}
                onChange={(e) => setForm({ ...form, homepageLabel: e.target.value })}
                placeholder="Ej: Visitar sitio web"
                maxLength={50}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>URL del enlace principal</label>
              <input
                value={form.homepageUrl}
                onChange={(e) => setForm({ ...form, homepageUrl: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">Botón principal que aparece en la tarjeta (sitio web, WhatsApp, etc.).</p>

          <div>
            <label className={labelClass}>URL de callback</label>
            <input
              value={form.walletCallbackUrl}
              onChange={(e) => setForm({ ...form, walletCallbackUrl: e.target.value })}
              placeholder="https://tudominio.com/api/wallet/callback"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-1">Google notifica a esta URL cuando alguien agrega o elimina la tarjeta de su wallet.</p>
          </div>
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
