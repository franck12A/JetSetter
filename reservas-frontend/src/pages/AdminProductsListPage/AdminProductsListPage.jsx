import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminProductsList from "../../components/AdminProductsList/AdminProductsList";
import { useNavigate } from "react-router-dom";

const LOCAL_KEY = "products";

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
  const perPage = 8;

  // ✅ Cargar productos del backend al iniciar
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

    // Si usás mock o localStorage también los fusionamos
    let mock = [];
    try {
      const res = await fetch("/mockVuelos.json"); // 👈 lo mantenemos por si lo usás como mock
      if (res.ok) mock = await res.json();
    } catch (err) {
      console.warn("No se pudo cargar mock:", err);
    }

    const local = readLocalProducts();
    const merged = [...backendProducts, ...mock, ...local];
    setProducts(merged);
  };

  // ✅ Eliminar producto (primero backend, luego lista local)
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        console.log("Producto eliminado del backend");
        const filtered = products.filter((p) => p.id !== id);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
        setProducts(filtered);
      } else {
        alert("❌ No se pudo eliminar el producto del servidor.");
      }
    } catch (error) {
      console.error("Error eliminando en backend:", error);
    }
  };

const handleEdit = (product) => {
  navigate(`/admin?edit=${product.id}`);
};


  return (
    <div className="admin-products-page container">
      <h1>Lista de Productos (Vuelos)</h1>
      <Link to="/admin" className="btn-back">
        ← Volver al Panel de Admin
      </Link>

      <AdminProductsList
        vuelos={products} // 👈 dejamos “vuelos” si así lo espera el componente interno
        onEdit={handleEdit}
        onDelete={handleDelete}
        page={page}
        setPage={setPage}
        perPage={perPage}
      />
    </div>
  );
}
