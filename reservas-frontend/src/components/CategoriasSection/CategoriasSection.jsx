import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaPlane } from "react-icons/fa";
import { getSafeIcon, CATEGORY_ICONS } from "../../utils/iconRegistry";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./CategoriasSection.css";

export default function CategoriasSection({ vuelos = [], categorias = [], onSelectCategoria }) {
  const listaCategorias = useMemo(() => {
    const mapCats = new Map();

    (categorias || []).forEach((c) => {
      const name = typeof c === "string" ? c : c?.name || "";
      if (!name) return;

      const iconToken =
        (typeof c === "object" && (c.icon || c.iconName || c.Icon || c.name)) || name;

      mapCats.set(name.toLowerCase(), {
        name,
        Icon: getSafeIcon(iconToken),
        count: 0,
      });
    });

    (vuelos || []).forEach((v) => {
      const cats = [
        ...(Array.isArray(v.categorias) ? v.categorias : []),
        v.category?.name || v.category || null,
      ].filter(Boolean);

      cats.forEach((cn) => {
        const key = String(cn).toLowerCase();
        if (!mapCats.has(key)) {
          mapCats.set(key, { name: cn, Icon: getSafeIcon(cn), count: 1 });
          return;
        }

        const existing = mapCats.get(key);
        mapCats.set(key, { ...existing, count: (existing.count || 0) + 1 });
      });
    });

    let res = Array.from(mapCats.values())
      .filter((cat) => cat.count > 0 || (vuelos || []).length === 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    if (res.length < 3) {
      const needed = 3 - res.length;
      const missing = Object.keys(CATEGORY_ICONS).filter(
        (k) => !res.some((c) => c.name.toLowerCase() === k.toLowerCase())
      );

      missing.slice(0, needed).forEach((k) => {
        res.push({ name: k, Icon: getSafeIcon(k), count: 0 });
      });
    }

    return res;
  }, [categorias, vuelos]);

  if (listaCategorias.length === 0) return <p>No hay categorias disponibles.</p>;

  return (
    <section className="categorias-section">
      <div className="categorias-header">
        <h2>Categorias</h2>
        <Link to="/resultados" className="ver-todas">Ver todas</Link>
      </div>

      <div className="categorias-grid">
        {listaCategorias.map((cat, index) => {
          const name = cat.name || cat;
          const IconCat = cat.Icon || getSafeIcon(name) || FaPlane;
          const to = `/resultados?categoria=${encodeURIComponent(name)}`;

          return (
            <Link
              key={name + index}
              className="categoria-card"
              to={to}
              onClick={() => onSelectCategoria?.(name)}
            >
              <div className="categoria-icono-wrapper">
                <IconCat className="categoria-icono" />
              </div>
              <span className="categoria-nombre">{name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
