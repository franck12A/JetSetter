// src/pages/AdminPanel/AdminPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./AdminPanel.css";
import AdminProductsList from "../../components/AdminProductsList/AdminProductsList";
import IconPicker from "../../components/IconPicker/IconPicker";
import { ICON_REGISTRY } from "../../utils/iconRegistry";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import { getFeatures, createFeature, updateFeature, deleteFeature } from "../../services/featureService";

const CATEGORIES_KEY = "categories_local";
const PAGE_SIZE = 10;
const MOBILE_MAX_WIDTH = 640;

function writeLocalCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories || []));
}

function toInputDate(value) {
  if (!value) return "";
  const str = String(value);
  if (str.length >= 10) return str.slice(0, 10);
  return "";
}

function toBackendDate(value) {
  if (!value) return "";
  if (String(value).includes("T")) return value;
  return `${value}T00:00`;
}

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

export default function AdminPanel() {
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [vuelos, setVuelos] = useState([]);
  const [categories, setCategories] = useState(() => {
    try {
      const raw = localStorage.getItem(CATEGORIES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [availableFeatures, setAvailableFeatures] = useState([]);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [backendError, setBackendError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [newFeature, setNewFeature] = useState({ title: "", icon: "" });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ title: "", description: "", imageUrl: "", icon: "" });

  const [form, setForm] = useState({
    id: null,
    name: "",
    country: "",
    price: "",
    departureDate: "",
    category: "",
    description: "",
    imageUrl: "",
    imageFilesDataUrls: [],
    features: [],
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_MAX_WIDTH);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const loadVuelos = async () => {
      try {
        const data = await productService.getAllProducts();
        setVuelos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando vuelos:", err);
        setBackendError("No se pudieron cargar los vuelos desde el backend.");
      }
    };

    const loadCategories = async () => {
      try {
        const data = await categoryService.getAll();
        const safe = Array.isArray(data) ? data : [];
        setCategories(safe);
        writeLocalCategories(safe);
      } catch (err) {
        console.error("Error cargando categorias:", err);
      }
    };

    const loadFeatures = async () => {
      try {
        const res = await getFeatures();
        const safe = Array.isArray(res?.data) ? res.data : [];
        setAvailableFeatures(safe);
      } catch (err) {
        console.error("Error cargando features:", err);
      }
    };

    loadVuelos();
    loadCategories();
    loadFeatures();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (!editId || vuelos.length === 0) return;
    const vuelo = vuelos.find((v) => String(v.id) === String(editId));
    if (vuelo) handleEdit(vuelo);
  }, [location.search, vuelos]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vuelos.filter((v) => {
      if (!q) return true;
      return String(v.id || "").toLowerCase().includes(q) ||
        String(v.name || "").toLowerCase().includes(q) ||
        String(v.country || "").toLowerCase().includes(q);
    });
  }, [vuelos, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pageItems = useMemo(() => buildPageItems(safePage, pageCount), [safePage, pageCount]);

  const visibleVuelos = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);


  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      country: "",
      price: "",
      departureDate: "",
      category: "",
      description: "",
      imageUrl: "",
      imageFilesDataUrls: [],
      features: [],
    });
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    Promise.all(
      files.map((file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        })
      )
    ).then((results) => {
      setForm((f) => ({ ...f, imageFilesDataUrls: results, imageUrl: "" }));
    });
  };

  const handleCreateOrUpdate = async (product) => {
    if (!product.name.trim() || !product.country.trim() || !product.price || !product.departureDate || !product.categoryId) {
      alert("Faltan campos obligatorios.");
      return;
    }

    try {
      const data = product.id
        ? await productService.updateProduct(product.id, product)
        : await productService.createProduct(product);

      setVuelos((prev) => {
        if (product.id) return prev.map((v) => (v.id === product.id ? data : v));
        return [data, ...prev];
      });

      resetForm();
      alert("Vuelo guardado correctamente");
    } catch (err) {
      console.error(err);
      const backendMsg = err?.response?.data;
      const message =
        typeof backendMsg === "string" && backendMsg.trim()
          ? backendMsg
          : (err?.message || "Error desconocido");
      alert("Error al guardar el vuelo: " + message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Seguro que queres eliminar este producto?")) return;
    try {
      await productService.deleteProduct(id);
      setVuelos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert("Error borrando vuelo: " + (err?.message || "Error"));
    }
  };

  const handleEdit = (vuelo) => {
    setEditingId(vuelo.id);
    setForm({
      id: vuelo.id,
      name: vuelo.name || "",
      country: vuelo.country || "",
      price: vuelo.price || "",
      departureDate: toInputDate(vuelo.departureDate),
      category: vuelo.category?.id || vuelo.categoryId || "",
      description: vuelo.description || "",
      imageUrl: vuelo.image || vuelo.imageUrl || "",
      imageFilesDataUrls: Array.isArray(vuelo.imagesBase64) ? vuelo.imagesBase64 : [],
      features: Array.isArray(vuelo.features)
        ? vuelo.features.map((f) => ({ id: f.id, name: f.name, type: f.type || "text", value: "" }))
        : [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openNewFeatureModal = () => {
    setEditingFeature(null);
    setNewFeature({ title: "", icon: "" });
    setShowFeatureModal(true);
  };

  const handleSaveFeature = async () => {
    if (!newFeature.title.trim()) {
      alert("El titulo de la caracteristica es obligatorio.");
      return;
    }
    if (!newFeature.icon) {
      alert("Selecciona un icono para la caracteristica.");
      return;
    }

    try {
      if (editingFeature?.id) {
        const res = await updateFeature(editingFeature.id, {
          name: newFeature.title.trim(),
          icon: newFeature.icon,
        });
        const updated = res?.data;
        setAvailableFeatures((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      } else {
        const res = await createFeature({
          name: newFeature.title.trim(),
          icon: newFeature.icon,
        });
        const created = res?.data;
        setAvailableFeatures((prev) => [created, ...prev]);
      }

      setShowFeatureModal(false);
      setEditingFeature(null);
      setNewFeature({ title: "", icon: "" });
    } catch (err) {
      console.error("Error guardando feature:", err);
      alert("No se pudo guardar la caracteristica.");
    }
  };

  const handleDeleteFeature = async (featureId) => {
    if (!window.confirm("Eliminar caracteristica?")) return;
    try {
      await deleteFeature(featureId);
      setAvailableFeatures((prev) => prev.filter((f) => f.id !== featureId));
      setForm((prev) => ({
        ...prev,
        features: (prev.features || []).filter((f) => f.id !== featureId),
      }));
    } catch (err) {
      console.error("Error eliminando feature:", err);
      alert("No se pudo eliminar la caracteristica.");
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategory.title.trim()) {
      alert("El titulo de la categoria es obligatorio.");
      return;
    }

    const payload = {
      name: newCategory.title.trim(),
      description: newCategory.description.trim(),
      imageUrl: newCategory.imageUrl || "",
      icon: newCategory.icon || "",
    };

    const saved = await categoryService.createCategory(payload);
    if (!saved) {
      alert("No se pudo crear la categoria.");
      return;
    }

    const updated = [saved, ...categories];
    setCategories(updated);
    writeLocalCategories(updated);
    setForm((f) => ({ ...f, category: saved.id }));

    setShowCategoryModal(false);
    setNewCategory({ title: "", description: "", imageUrl: "", icon: "" });
  };

  const clearLocalData = () => {

    if (!window.confirm("Limpiar datos locales (categorias cache)?")) return;
    localStorage.removeItem(CATEGORIES_KEY);
    setCategories([]);
  };

  const handleJump = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isMobile) {
    return (
      <div className="admin-mobile-warning">
        <h2>Panel no disponible en dispositivos moviles</h2>
        <p>Accede desde computadora o tablet.</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-top-bar">
        <Link to="/" className="admin-logo" aria-label="Ir al inicio">
          <img src="/assets/logoJettSeter.png" alt="JetSetter Logo" className="admin-logo-img" />
          <span style={{ color: "#3b82f6", fontWeight: 700 }}>JetSetter</span>
          <span style={{ color: "#000", fontWeight: 700 }}>Admin</span>
        </Link>
        <div className="admin-top-actions">
          <Link to="/" className="btn-top-action btn-view">Ver sitio</Link>
          <button className="btn-top-action btn-clear" onClick={clearLocalData}>Limpiar</button>
        </div>
      </div>

      <nav className="admin-menu">
        <button type="button" className="admin-menu-link" onClick={() => handleJump("admin-form")}>Vuelos</button>
        <button type="button" className="admin-menu-link" onClick={() => handleJump("admin-features")}>Caracteristicas</button>
        <button type="button" className="admin-menu-link" onClick={() => handleJump("admin-categories")}>Categorias</button>
        <button type="button" className="admin-menu-link" onClick={() => handleJump("admin-products")}>Listado de productos</button>
        <Link to="/administracion/usuarios" className="admin-menu-link">Usuarios</Link>
      </nav>

      <header className="admin-header">
        <div className="admin-header-main">
          <div className="admin-title-section">
            <h1>Administracion de Vuelos</h1>
            <p>Gestiona inventario, categorias y caracteristicas.</p>
          </div>
        </div>
        {backendError && <div className="form-error">{backendError}</div>}
      </header>

      <section id="admin-features" className="admin-features-section">
        <div className="features-section-header">
          <h2>Caracteristicas registradas</h2>
          <div className="features-header-right">
            <span className="features-count">{availableFeatures.length} total</span>
            <button className="btn-new-feature" onClick={openNewFeatureModal}>+ Nueva</button>
          </div>
        </div>

        {availableFeatures.length === 0 ? (
          <p className="no-data">No hay caracteristicas aun.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Icono</th>
                <th>ID</th>
                <th style={{ textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {availableFeatures.map((feat) => (
                <tr key={feat.id}>
                  <td>{feat.name}</td>
                  <td>{feat.icon || "-"}</td>
                  <td>{feat.id || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setEditingFeature(feat);
                        setNewFeature({ title: feat.name || "", icon: feat.icon || "" });
                        setShowFeatureModal(true);
                      }}
                    >
                      Editar
                    </button>
                    <button className="btn-delete" onClick={() => handleDeleteFeature(feat.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section id="admin-categories" className="admin-features-section">
        <div className="features-section-header">
          <h2>Categorias registradas</h2>
          <div className="features-header-right">
            <span className="features-count">{categories.length} total</span>
            <button
              className="btn-new-feature"
              onClick={() => {
                setNewCategory({ title: "", description: "", imageUrl: "", icon: "" });
                setShowCategoryModal(true);
              }}
            >
              + Nueva
            </button>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="no-data">No hay categorias aun.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Icono</th>
                <th>Nombre</th>
                <th>Descripcion</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const Icon = ICON_REGISTRY[cat.icon] || null;
                return (
                  <tr key={cat.id || cat.name}>
                    <td>{Icon ? <Icon /> : "-"}</td>
                    <td>{cat.name}</td>
                    <td>{cat.description || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <main className="container">
        <section id="admin-form" className="admin-form">
          <h2>{editingId ? "Editar vuelo" : "Crear nuevo vuelo"}</h2>
          <p>Completa todos los campos para publicar un nuevo destino.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateOrUpdate({
                id: form.id,
                name: form.name,
                country: form.country,
                price: Number(form.price),
                departureDate: toBackendDate(form.departureDate),
                categoryId: Number(form.category),
                description: form.description,
                features: (form.features || []).map((f) => ({ id: f.id, name: f.name })),
                image: form.imageUrl || null,
                imagesBase64: form.imageFilesDataUrls || [],
              });
            }}
          >
            <div className="grid-2">
              <label>
                Nombre del Vuelo
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>

              <label>
                Pais de Destino
                <input required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </label>

              <label>
                Precio (USD)
                <input type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>

              <label>
                Fecha de salida
                <input type="date" required value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} />
              </label>

              <label>
                Categoria
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    required
                    value={form.category || ""}
                    onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}
                  >
                    <option value="">Seleccionar categoria...</option>
                    {categories.map((c) => (
                      <option key={`cat-${c.id}`} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
                    +
                  </button>
                </div>
              </label>

              <label>
                Descripcion del Vuelo
                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>

              <label>
                Caracteristicas del vuelo
                <div className="features-list">
                  {availableFeatures.length === 0 && (
                    <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>No hay caracteristicas creadas.</p>
                  )}

                  {availableFeatures.map((feat) => {
                    const selected = (form.features || []).find((f) => f.id === feat.id);
                    return (
                      <div key={`feat-item-${feat.id}`} className="feature-item">
                        <label>
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm((f) => ({
                                  ...f,
                                  features: [...(f.features || []), { id: feat.id, name: feat.name }],
                                }));
                              } else {
                                setForm((f) => ({
                                  ...f,
                                  features: (f.features || []).filter((x) => x.id !== feat.id),
                                }));
                              }
                            }}
                          />
                          {feat.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </label>

              <label>
                Imagen (URL)
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value, imageFilesDataUrls: [] })} />
              </label>

              <label>
                Subir imagen
                <input ref={fileInputRef} onChange={handleFilesChange} type="file" accept="image/*" multiple />
              </label>
            </div>

            <div className="preview">
              {form.imageFilesDataUrls.length > 0 ? (
                form.imageFilesDataUrls.map((src, i) => <img key={i} src={src} alt={`preview-${i}`} />)
              ) : form.imageUrl ? (
                <img src={form.imageUrl} alt="url-preview" />
              ) : (
                <div>Sin imagen</div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary">{editingId ? "Guardar cambios" : "Agregar producto"}</button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
              )}
            </div>
          </form>
        </section>

        <section id="admin-products" className="admin-list">
          <input
            className="search-input"
            placeholder="Buscar por id, nombre o pais..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <AdminProductsList vuelos={visibleVuelos} onEdit={handleEdit} onDelete={handleDelete} />

          <div className="admin-list-footer">
            <span className="admin-list-counter">Mostrando {visibleVuelos.length} de {filtered.length} productos</span>
            <div className="admin-pagination">
              <span className="admin-pagination-info">Pagina {safePage} de {pageCount}</span>
              <div className="admin-pagination-controls">
                <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}>
                  Inicio
                </button>
                <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={safePage === 1}>
                  Anterior
                </button>
                <div className="admin-page-list">
                  {pageItems.map((item, index) =>
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
        </section>
      </main>

      {showFeatureModal && (
        <div className="feature-modal-overlay">
          <div className="feature-modal">
            <h2>{editingFeature ? "Editar caracteristica" : "Nueva caracteristica"}</h2>

            <input
              type="text"
              placeholder="Titulo"
              value={newFeature.title}
              onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
            />

            <label style={{ display: "block", marginBottom: 6 }}>Icono</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #eee" }}>
                {newFeature.icon && ICON_REGISTRY[newFeature.icon]
                  ? React.createElement(ICON_REGISTRY[newFeature.icon])
                  : <span style={{ opacity: 0.6 }}>-</span>}
              </div>
              <div style={{ fontSize: 14, color: "#444" }}>{newFeature.icon || "Ningun icono seleccionado"}</div>
            </div>
            <IconPicker value={newFeature.icon} onChange={(iconName) => setNewFeature({ ...newFeature, icon: iconName })} columns={6} />

            <div className="modal-buttons">
              <button onClick={() => setShowFeatureModal(false)}>Cancelar</button>
              <button onClick={handleSaveFeature}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="feature-modal-overlay">
          <div className="feature-modal">
            <h2>Nueva categoria</h2>

            <input
              type="text"
              placeholder="Titulo"
              value={newCategory.title}
              onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
            />

            <textarea
              placeholder="Descripcion"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Icono</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #eee" }}>
                  {newCategory.icon && ICON_REGISTRY[newCategory.icon]
                    ? React.createElement(ICON_REGISTRY[newCategory.icon])
                    : <span style={{ opacity: 0.6 }}>-</span>}
                </div>
                <div style={{ fontSize: 14, color: "#444" }}>{newCategory.icon || "Ningun icono seleccionado"}</div>
              </div>

              <IconPicker
                value={newCategory.icon}
                onChange={(iconName) => setNewCategory({ ...newCategory, icon: iconName })}
                columns={6}
              />
            </div>

            <input
              type="text"
              placeholder="URL de imagen (opcional)"
              value={newCategory.imageUrl}
              onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
            />

            <div className="modal-buttons">
              <button onClick={() => setShowCategoryModal(false)}>Cancelar</button>
              <button onClick={handleSaveCategory}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

