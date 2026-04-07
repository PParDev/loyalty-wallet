"use client";

import { useEffect, useState } from "react";

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({ name: "", address: "", city: "", phone: "" });

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      const json = await res.json();
      if (json.success) setLocations(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setLocations((prev) => [json.data, ...prev]);
        setIsAdding(false);
        setFormData({ name: "", address: "", city: "", phone: "" });
      } else {
        alert(json.error);
      }
    } catch (error) {
      alert("Error guardando sucursal");
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
          <p className="text-sm text-gray-500">Gestiona las diferentes ubicaciones de tu negocio.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          {isAdding ? "Cancelar" : "+ Nueva Sucursal"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl border border-gray-200 mb-8 max-w-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Agregar Sucursal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Ej. Sucursal Centro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                <input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              disabled={!formData.name}
              type="submit"
              className="w-full bg-indigo-600 text-white flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Guardar Sucursal
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {locations.length === 0 ? (
          <div className="col-span-full border border-dashed border-gray-300 text-center py-12 rounded-xl text-gray-500 text-sm">
            <p>No tienes sucursales registradas.</p>
            <p className="mt-1 text-xs">Añade una sucursal para poder asignar cajeros.</p>
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">{loc.name}</h3>
                <p className="text-[10px] text-gray-400 mb-4 font-mono uppercase tracking-wide">ID: {loc.id.split("-")[0]}</p>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <p className="flex items-start gap-2">
                    <span className="text-gray-400">📍</span>
                    <span>{loc.address || "Sin dirección"}{loc.city ? `, ${loc.city}` : ""}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-gray-400">📞</span>
                    <span>{loc.phone || "Sin teléfono"}</span>
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {loc.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
