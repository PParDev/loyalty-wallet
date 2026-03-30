"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CardResult {
  cardId: string;
  currentPoints: number;
  businessName: string;
  businessLogoUrl: string | null;
  programName: string;
  cardBgColor: string;
  cardTextColor: string;
}

export default function CardLookupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<CardResult[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCards(null);

    const res = await fetch("/api/cards/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() }),
    }).then((r) => r.json());

    if (!res.success) {
      setError(res.error);
      setLoading(false);
      return;
    }

    const found: CardResult[] = res.data.cards;

    if (found.length === 1) {
      router.push(`/card/${found[0].cardId}`);
      return;
    }

    setCards(found);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mis tarjetas</h1>
          <p className="text-sm text-gray-500 mt-1">Ingresa tu número para ver tus puntos</p>
        </div>

        {/* Form */}
        {!cards && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Número de teléfono
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(null); }}
              placeholder="311 123 4567"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              autoFocus
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || phone.trim().length < 7}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Buscando...
                </span>
              ) : "Ver mis tarjetas"}
            </button>
          </form>
        )}

        {/* Multiple cards — pick one */}
        {cards && (
          <div>
            <p className="text-sm text-gray-500 text-center mb-4">
              Tienes tarjetas en {cards.length} negocios. ¿Cuál quieres ver?
            </p>
            <div className="space-y-3">
              {cards.map((c) => (
                <button
                  key={c.cardId}
                  onClick={() => router.push(`/card/${c.cardId}`)}
                  className="w-full text-left rounded-2xl overflow-hidden shadow-md hover:scale-[1.02] transition-transform"
                  style={{ backgroundColor: c.cardBgColor, color: c.cardTextColor }}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      {c.businessLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.businessLogoUrl} alt={c.businessName} className="h-8 object-contain mb-2" />
                      ) : (
                        <p className="font-bold text-base mb-0.5">{c.businessName}</p>
                      )}
                      <p className="text-xs opacity-70">{c.programName}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-3xl font-bold">{c.currentPoints}</p>
                      <p className="text-xs opacity-60">puntos</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setCards(null); setPhone(""); }}
              className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              Buscar otro número
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
