// src/components/Main/Main.jsx
import React, { useEffect, useState } from "react";
import "./Main.css";
import CategoriasSection from "../../components/CategoriasSection/CategoriasSection";
import Recomendaciones from "../../components/Recomendaciones/Recomendaciones";
import "../../styles/global.css";
import DetalleVuelo from "../../pages/DetalleVuelo/DetalleVuelo";



// Función para mezclar array (solo para variedad visual)
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function Main() {
  const [scrollY, setScrollY] = useState(0);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [vuelos, setVuelos] = useState([]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);

    const loadVuelos = async () => {
      try {
        // 1️⃣ Traer los del archivo mock
        const res = await fetch("/mockVuelos.json");
        const data = await res.json();

        // 2️⃣ Traer los guardados en localStorage
        const locales = JSON.parse(localStorage.getItem("vuelos")) || [];

        // 3️⃣ Mezclar ambos
        const todos = [...locales, ...data];
        const shuffled = shuffleArray(todos);

        setVuelos(shuffled);
      } catch (err) {
        console.error("Error cargando vuelos:", err);
      }
    };

    loadVuelos();

    // 🔁 Detectar cambios en localStorage en tiempo real
    const handleStorageChange = () => {
      const locales = JSON.parse(localStorage.getItem("vuelos")) || [];
      setVuelos((prev) => shuffleArray([...locales, ...prev.filter(v => !v.id)]));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 4️⃣ Filtrar por categoría seleccionada
  const vuelosFiltrados = categoriaSeleccionada
    ? vuelos.filter((v) => v.category === categoriaSeleccionada)
    : vuelos;

  return (
    <section className="main">
      <CategoriasSection
        vuelos={vuelosFiltrados}
        onSelectCategoria={setCategoriaSeleccionada}
      />
      <Recomendaciones vuelos={vuelos} />
    </section>
  );
}
