"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ImageUpload from "@/components/ui/ImageUpload";
import QrDownloadSection from "@/components/dashboard/QrDownloadSection";

type Step = 1 | 2 | 3 | 4;

const categoryOptions = [
  { value: "cafeteria", label: "Cafetería" },
  { value: "barberia", label: "Barbería" },
  { value: "restaurante", label: "Restaurante" },
  { value: "farmacia", label: "Farmacia" },
  { value: "lavanderia", label: "Lavandería" },
  { value: "tienda", label: "Tienda" },
  { value: "gym", label: "Gym / Estudio" },
  { value: "salon", label: "Salón de belleza" },
  { value: "otro", label: "Otro" },
];

const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "text-sm font-medium text-gray-700 block mb-1.5";

export default function OnboardingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState("");

  // Step 1: Business info
  const [biz, setBiz] = useState({
    logoUrl: "",
    description: "",
    phone: "",
    address: "",
    city: "Tepic",
  });

  // Step 2: Program config
  const [program, setProgram] = useState({
    programName: "",
    earningMode: "visit" as "visit" | "amount" | "stamps",
    pointsPerVisit: 1,
    pointsPerCurrency: 0.5,
    stampsRequired: 10,
    cardBgColor: "#1a1a2e",
    cardTextColor: "#ffffff",
  });

  // Step 3: First reward
  const [reward, setReward] = useState({
    name: "",
    pointsRequired: "",
    rewardType: "freebie",
    description: "",
  });

  // Load business data
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/businesses/me")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSlug(res.data.slug);
          const prog = res.data.loyaltyPrograms?.[0];
          if (prog) {
            setProgram((p) => ({ ...p, programName: prog.name }));
          }
        }
      });
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const saveStep1 = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/businesses/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(biz),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) {
      setStep(2);
    } else {
      setError(res.error);
    }
  };

  const saveStep2 = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/businesses/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(program),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) {
      setStep(3);
    } else {
      setError(res.error);
    }
  };

  const saveStep3 = async () => {
    if (!reward.name || !reward.pointsRequired) {
      setError("El nombre y los puntos requeridos son obligatorios");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: reward.name,
        pointsRequired: parseInt(reward.pointsRequired),
        rewardType: reward.rewardType,
        description: reward.description || undefined,
      }),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) {
      setStep(4);
    } else {
      setError(res.error);
    }
  };

  const finishOnboarding = async () => {
    setSaving(true);
    await fetch("/api/businesses/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingCompleted: true }),
    });
    router.push("/dashboard");
  };

  const skipStep3 = async () => {
    setStep(4);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cardPreviewStyle = { backgroundColor: program.cardBgColor, color: program.cardTextColor };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-indigo-600">LoyaltyWallet</h1>
          <span className="text-sm text-gray-400">Paso {step} de 4</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-6">
          <div className="flex gap-1 py-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-indigo-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Business info */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Personaliza tu negocio</h2>
                <p className="text-sm text-gray-500 mt-1">Esta información aparecerá cuando tus clientes se registren.</p>
              </div>

              <div className="space-y-5">
                <ImageUpload
                  label="Logo de tu negocio"
                  value={biz.logoUrl}
                  onChange={(url) => setBiz({ ...biz, logoUrl: url })}
                  hint="Recomendado: imagen cuadrada, fondo transparente"
                />

                <div>
                  <label className={labelClass}>Descripción breve</label>
                  <textarea
                    value={biz.description}
                    onChange={(e) => setBiz({ ...biz, description: e.target.value })}
                    rows={2}
                    className={inputClass}
                    placeholder="Ej: El mejor café artesanal de Tepic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Teléfono</label>
                    <input
                      type="tel"
                      value={biz.phone}
                      onChange={(e) => setBiz({ ...biz, phone: e.target.value })}
                      className={inputClass}
                      placeholder="311 123 4567"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Ciudad</label>
                    <input
                      value={biz.city}
                      onChange={(e) => setBiz({ ...biz, city: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Dirección</label>
                  <input
                    value={biz.address}
                    onChange={(e) => setBiz({ ...biz, address: e.target.value })}
                    className={inputClass}
                    placeholder="Av. México 123, Col. Centro"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <span />
                <button onClick={saveStep1} disabled={saving} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? "Guardando..." : "Siguiente →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Program config */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Configura tu programa</h2>
                <p className="text-sm text-gray-500 mt-1">Define cómo tus clientes acumulan puntos.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Nombre del programa</label>
                  <input
                    value={program.programName}
                    onChange={(e) => setProgram({ ...program, programName: e.target.value })}
                    className={inputClass}
                    placeholder="Club de Lealtad"
                  />
                </div>

                <div>
                  <label className={labelClass}>¿Cómo acumulan puntos?</label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                    {(["visit", "stamps", "amount"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setProgram({ ...program, earningMode: mode })}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          program.earningMode === mode
                            ? "bg-indigo-600 text-white"
                            : "text-gray-600 hover:bg-gray-50 bg-white"
                        }`}
                      >
                        {mode === "visit" ? "Por visita" : mode === "stamps" ? "Sellos" : "Por monto"}
                      </button>
                    ))}
                  </div>
                </div>

                {program.earningMode === "stamps" ? (
                  <div>
                    <label className={labelClass}>¿Cuántos sellos para la recompensa?</label>
                    <input
                      type="number"
                      min="3"
                      max="20"
                      value={program.stampsRequired}
                      onChange={(e) => setProgram({ ...program, stampsRequired: parseInt(e.target.value) || 10 })}
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-400 mt-1">Ej: 10 = "Compra 10, el 11 gratis". Cada visita = 1 sello.</p>
                  </div>
                ) : program.earningMode === "visit" ? (
                  <div>
                    <label className={labelClass}>Puntos por cada visita</label>
                    <input
                      type="number"
                      min="1"
                      value={program.pointsPerVisit}
                      onChange={(e) => setProgram({ ...program, pointsPerVisit: parseInt(e.target.value) || 1 })}
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-400 mt-1">El cliente gana estos puntos cada vez que visita.</p>
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>Puntos por cada $1 MXN</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={program.pointsPerCurrency}
                      onChange={(e) => setProgram({ ...program, pointsPerCurrency: parseFloat(e.target.value) || 0.5 })}
                      className={inputClass}
                    />
                    <p className="text-xs text-gray-400 mt-1">Ej: 0.5 = 1 punto por cada $2 gastados.</p>
                  </div>
                )}

                {/* Colores de la tarjeta */}
                <div>
                  <label className={labelClass}>Colores de tu tarjeta</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <input type="color" value={program.cardBgColor} onChange={(e) => setProgram({ ...program, cardBgColor: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5" />
                      <span className="text-xs text-gray-500">Fondo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={program.cardTextColor} onChange={(e) => setProgram({ ...program, cardTextColor: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer p-0.5" />
                      <span className="text-xs text-gray-500">Texto</span>
                    </div>
                  </div>
                </div>

                {/* Mini preview */}
                <div className="rounded-2xl p-4 shadow-md" style={cardPreviewStyle}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold opacity-90">{program.programName || "Tu programa"}</p>
                      <p className="text-xs opacity-60 mt-0.5">Vista previa</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">10</p>
                      <p className="text-xs opacity-60">puntos</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                  ← Atrás
                </button>
                <button onClick={saveStep2} disabled={saving} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? "Guardando..." : "Siguiente →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: First reward */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Crea tu primera recompensa</h2>
                <p className="text-sm text-gray-500 mt-1">¿Qué pueden ganar tus clientes al acumular puntos?</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Nombre de la recompensa *</label>
                  <input
                    value={reward.name}
                    onChange={(e) => setReward({ ...reward, name: e.target.value })}
                    className={inputClass}
                    placeholder="Ej: Café gratis, 20% de descuento, Corte gratis..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Puntos requeridos *</label>
                    <input
                      type="number"
                      min="1"
                      value={reward.pointsRequired}
                      onChange={(e) => setReward({ ...reward, pointsRequired: e.target.value })}
                      className={inputClass}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo</label>
                    <select
                      value={reward.rewardType}
                      onChange={(e) => setReward({ ...reward, rewardType: e.target.value })}
                      className={inputClass}
                    >
                      <option value="freebie">Gratis</option>
                      <option value="discount">Descuento</option>
                      <option value="upgrade">Mejora</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Descripción (opcional)</label>
                  <input
                    value={reward.description}
                    onChange={(e) => setReward({ ...reward, description: e.target.value })}
                    className={inputClass}
                    placeholder="Ej: Un café americano o latte de cualquier tamaño"
                  />
                </div>

                {/* Quick suggestion */}
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-indigo-700 mb-2">Sugerencias rápidas:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: "Producto gratis", pts: "10" },
                      { name: "10% de descuento", pts: "5" },
                      { name: "2x1", pts: "8" },
                    ].map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setReward({ ...reward, name: s.name, pointsRequired: s.pts })}
                        className="bg-white text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors"
                      >
                        {s.name} ({s.pts} pts)
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                  ← Atrás
                </button>
                <div className="flex gap-3">
                  <button onClick={skipStep3} className="text-gray-400 hover:text-gray-600 text-sm font-medium px-4 py-3">
                    Omitir
                  </button>
                  <button onClick={saveStep3} disabled={saving} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {saving ? "Guardando..." : "Crear recompensa →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Done! */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Todo listo! 🎉</h2>
                <p className="text-gray-500 mb-6">Tu programa de lealtad está configurado. Descarga el QR y empieza a registrar clientes.</p>
              </div>

              {slug && <QrDownloadSection slug={slug} />}

              <button
                onClick={finishOnboarding}
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Cargando..." : "Ir a mi dashboard →"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
