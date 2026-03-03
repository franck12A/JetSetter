import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaPlane } from "react-icons/fa";

import VueloCard from "../../components/VueloCards";

import productService from "../../services/productService";
import { getSafeIcon, CATEGORY_ICONS } from "../../utils/iconRegistry";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./CategoriasSection.css";

export default function CategoriasSection({ vuelos = [], categorias = [], onSelectCategoria }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // lista de categorías con iconos garantizados
  const listaCategorias = useMemo(() => {
    let res = [];
    if (Array.isArray(categorias) && categorias.length > 0) {
      res = categorias.map((c) => {
        if (typeof c === "string") {
          return { name: c, Icon: getSafeIcon(c) };
        }
        return {
          ...c,
          name: c.name || c,
          Icon: c.Icon || getSafeIcon(c.name || c),
        };
      });
    } else {
      // reconstruir a partir de los vuelos para compatibilidad
      const mapCats = new Map();
      (vuelos || []).forEach((v) => {
        (v.categorias || []).forEach((cn) => {
          if (!mapCats.has(cn)) mapCats.set(cn, { name: cn, Icon: getSafeIcon(cn) });
        });
        if (v.category) {
          const cn = v.category.name || v.category;
          if (!mapCats.has(cn)) {
            mapCats.set(cn, {
              name: cn,
              Icon: v.category.Icon || getSafeIcon(cn),
            });
          }
        }
      });
      res = Array.from(mapCats.values());
    }
    // si no hay suficientes categories, añadir defaults del registry para demo
    if (res.length < 3) {
      const needed = 3 - res.length;
      const missing = Object.keys(CATEGORY_ICONS).filter(
        (k) => !res.some((c) => c.name === k)
      );
      missing.slice(0, needed).forEach((k) => {
        res.push({ name: k, Icon: getSafeIcon(k) });
      });
    }
    return res;
  }, [categorias, vuelos]);

  // estado de productos solo para mantener compatibilidad si se usa externamente
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    // opcional: cargar productos para crear recomendaciones de categoria externa
    const loadProductos = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await productService.getAllProducts();
        setProductos(data);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError("No se pudieron cargar los vuelos");
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };
    loadProductos();
  }, []);

  if (loading) return <p>Cargando categorías...</p>;
  if (error) return <p>{error}</p>;
  if (listaCategorias.length === 0) return <p>No hay categorías disponibles.</p>;

  return (
    <section className="categorias-section">
      <div className="categorias-header">
        <h2>Categorías</h2>
        <a href="#/resultados" className="ver-todas">Ver todas</a>
      </div>

      <div className="categorias-grid">
        {listaCategorias.map((cat, index) => {
          const name = cat.name || cat;
          const IconCat = cat.Icon || getSafeIcon(name) || FaPlane;
          const handleClick = () => {
            if (onSelectCategoria) onSelectCategoria(name);
          };

          return (
            <div key={name + index} className="categoria-card" onClick={handleClick}>
              <div className="categoria-icono-wrapper">
                <IconCat className="categoria-icono" />
              </div>
              <span className="categoria-nombre">{name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
