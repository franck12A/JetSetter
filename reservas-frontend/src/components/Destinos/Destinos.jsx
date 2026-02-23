import React from "react";
import { Link } from "react-router-dom";

/**
 * Carrusel horizontal simple: overflow-x + cards
 * usa vuelo.id como key (debe ser único)
 */
export default function Destinos({ vuelos = [], loading = false }) {
  if (loading) return <p className="py-6 text-center">Cargando destinos...</p>;
  if (!vuelos || vuelos.length === 0) return null;

  return (
    <section className="my-6">
      <h3 className="text-xl font-semibold mb-3">Destinos recomendados</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {vuelos.map((v) => (
          <Link
            key={String(v.id)}
            to={`/vuelo/${v.id}`}
            className="min-w-[220px] bg-white rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1"
          >
            <img src={v.image} alt={v.name} className="w-full h-36 object-cover rounded-t-xl" />
            <div className="p-3">
              <h4 className="text-sm font-semibold truncate">{v.name}</h4>
              <p className="text-xs text-gray-500 truncate">{v.country}</p>
              <p className="text-blue-600 font-bold mt-2">${v.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
