"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import type { BusinessPublicInfo } from "@/types";

type Step = "form" | "success";

export default function RegisterClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [business, setBusiness] = useState<BusinessPublicInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [cardId, setCardId] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [googleWalletUrl, setGoogleWalletUrl] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/businesses/${slug}/public`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setBusiness(res.data);
        else setNotFound(true);
      });
  }, [slug]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/customers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, businessSlug: slug }),
    }).then((r) => r.json());

    if (!res.success) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setCardId(res.data.cardId);
    setAlreadyRegistered(res.data.alreadyRegistered);

    // Generar link de Google Wallet
    const walletRes = await fetch("/api/wallet/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: res.data.cardId }),
    }).then((r) => r.json());

    if (walletRes.success) setGoogleWalletUrl(walletRes.data.saveUrl);

    setStep("success");
    setLoading(false);
  };

  const handleAppleWallet = async () => {
    if (!cardId) return;
    const res = await fetch("/api/wallet/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "loyalty.pkpass";
      a.click();
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600">Negocio no encontrado</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  const bgColor = business.program?.cardBgColor ?? "#1a1a2e";
  const textColor = business.program?.cardTextColor ?? "#ffffff";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Card preview */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 mb-6 shadow-lg"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {business.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.logoUrl} alt={business.name} className="h-12 object-contain mb-4" />
        )}
        <h1 className="text-xl font-bold">{business.name}</h1>
        <p className="text-sm opacity-75 mt-0.5">{business.program?.name ?? "Programa de lealtad"}</p>
        {business.program && (
          <p className="text-xs opacity-60 mt-3">
            Gana {business.program.pointsPerVisit} punto{business.program.pointsPerVisit !== 1 ? "s" : ""} por visita
            {business.program.pointsPerCurrency > 0 && ` · ${business.program.pointsPerCurrency} pt por $1 gastado`}
          </p>
        )}
      </div>

      {step === "form" ? (
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Únete al programa</h2>
          <p className="text-sm text-gray-500 mb-4">Tu tarjeta de lealtad digital</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Nombre completo *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Teléfono *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="311 123 4567"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Correo (opcional)</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="tu@correo.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 mt-2"
            >
              {loading ? "Registrando..." : "Obtener mi tarjeta"}
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
            {alreadyRegistered ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h2 className="font-semibold text-gray-900 text-lg">
            {alreadyRegistered ? "¡Ya eres miembro!" : "¡Bienvenido!"}
          </h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {alreadyRegistered
              ? "Ya tenías una tarjeta con este negocio. Agrégala a tu wallet."
              : "Tu tarjeta de lealtad está lista. Agrégala a tu wallet."}
          </p>

          <div className="space-y-3">
            {googleWalletUrl && (
              <a
                href={googleWalletUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800"
              >
                <span>Agregar a Google Wallet</span>
              </a>
            )}
            <button
              onClick={handleAppleWallet}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800"
            >
              <span>Agregar a Apple Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
