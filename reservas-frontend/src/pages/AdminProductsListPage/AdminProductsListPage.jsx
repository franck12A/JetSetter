import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminProductsList from "../../components/AdminProductsList/AdminProductsList";

const LOCAL_KEY = "products";
const PER_PAGE = 10;

function buildPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items = [];
  const add = (value) => items.push(value);

  add(1);

  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);

  if (start > 2) add("...");
  for (let i = start; i <= end; i += 1) add(i);
  if (end < total - 1) add("...");

  add(total);
  return items;
}

function readLocalProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function AdminProductsListPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    let backendProducts = [];
    try {
      const res = await fetch("http://localhost:8080/api/products");
      if (res.ok) backendProducts = await res.json();
    } catch (err) {
      console.warn("No se pudo cargar productos del backend:", err);
    }

    let mock = [];
    try {
      const res = await fetch("/mockVuelos.json");
      if (res.ok) mock = await res.json();
    } catch (err) {
      console.warn("No se pudo cargar mock:", err);
    }

    const local = readLocalProducts();
    const merged = [...backendProducts, ...mock, ...local];
    setProducts(merged);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Eliminar este producto?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const filtered = products.filter((p) => p.id !== id);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
        setProducts(filtered);
      } else {
        alert("No se pudo eliminar el producto del servidor.");
      }
    } catch (error) {
      console.error("Error eliminando en backend:", error);
    }
  };

  const handleEdit = (product) => {
    navigate(`/administracion?edit=${product.id}`);
  };

  const pageCount = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageNumbers = useMemo(() => buildPageItems(safePage, pageCount), [safePage, pageCount]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PER_PAGE;
    return products.slice(start, start + PER_PAGE);
  }, [products, safePage]);

  return (
    <div className="admin-products-page container">
      <h1>Lista de Productos (Vuelos)</h1>
      <Link to="/administracion" className="btn-back">
        Volver al Panel de Admin
      </Link>

      <AdminProductsList
        vuelos={pageItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="admin-products-pagination">
        <div className="admin-products-pagination-left">
          <span className="admin-page-counter">Pagina {safePage} de {pageCount}</span>
        </div>
        <div className="admin-products-pagination-right">
          <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}>
            Inicio
          </button>
          <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={safePage === 1}>
            Anterior
          </button>
          <div className="admin-page-list">
            {pageNumbers.map((item, index) =>
              item === "..." ? (
                <span key={`page-ellipsis-${index}`} className="admin-page-ellipsis">...</span>
              ) : (
                <button
                  key={`page-${item}`}
                  type="button"
                  className={`admin-page-btn ${item === safePage ? "active" : ""}`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>
          <button type="button" onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))} disabled={safePage === pageCount}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
