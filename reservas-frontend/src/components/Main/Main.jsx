import React, { useEffect, useState } from "react";
import "./Main.css";
import CategoriasSection from "../../components/CategoriasSection/CategoriasSection";
import Recomendaciones from "../../components/Recomendaciones/Recomendaciones";
import "../../styles/global.css";

const resolveCategorias = (vuelo = {}) => {
  const categorias = [];
  if (Array.isArray(vuelo.categorias)) categorias.push(...vuelo.categorias);
  if (vuelo.categoria) categorias.push(vuelo.categoria);
  if (vuelo.category?.name) categorias.push(vuelo.category.name);
  if (typeof vuelo.category === "string") categorias.push(vuelo.category);
  return categorias.filter(Boolean);
};

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function Main() {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [vuelos, setVuelos] = useState([]);

  useEffect(() => {
    const loadVuelos = async () => {
      try {
        const res = await fetch("/mockVuelos.json");
        const data = await res.json();
        const locales = JSON.parse(localStorage.getItem("vuelos") || "[]");
        setVuelos(shuffleArray([...(Array.isArray(locales) ? locales : []), ...(Array.isArray(data) ? data : [])]));
      } catch (err) {
        console.error("Error cargando vuelos:", err);
      }
    };

    loadVuelos();

    const handleStorageChange = () => {
      const locales = JSON.parse(localStorage.getItem("vuelos") || "[]");
      setVuelos((prev) => shuffleArray([...(Array.isArray(locales) ? locales : []), ...prev.filter((item) => !item.id)]));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const vuelosFiltrados = categoriaSeleccionada
    ? vuelos.filter((vuelo) => resolveCategorias(vuelo).some((categoria) => normalizeText(categoria) === normalizeText(categoriaSeleccionada)))
    : vuelos;

  return (
    <section className="main">
      <CategoriasSection vuelos={vuelosFiltrados} onSelectCategoria={setCategoriaSeleccionada} />
      <Recomendaciones vuelos={vuelosFiltrados} />
    </section>
  );
}
