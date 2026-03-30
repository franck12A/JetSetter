import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./AdminPanel.css";
import AdminProductsList from "../../components/AdminProductsList/AdminProductsList";
import IconPicker from "../../components/IconPicker/IconPicker";
import { ICON_REGISTRY } from "../../utils/iconRegistry";
import {
  MdDeleteOutline,
  MdFlightTakeoff,
  MdOutlineCalendarToday,
  MdOutlineCloudUpload,
  MdOutlineImage,
  MdOutlinePublic,
} from "react-icons/md";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import { createFeature, deleteFeature, getFeatures, updateFeature } from "../../services/featureService";

const CATEGORIES_KEY = "categories_local";
const PAGE_SIZE = 10;
const AIRLINE_PATTERN = /^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 .&/'-]{1,59}$/;
const FLIGHT_NUMBER_PATTERN = /^[A-Za-z0-9]{2,3}-?[A-Za-z0-9]{1,6}$/;
const LOCATION_PATTERN = /^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 .,'-]{1,79}$/;
const STATUS_META = {
  DRAFT: { label: "Borrador", note: "No visible públicamente ni reservable hasta publicarlo." },
  ACTIVE: { label: "Activo", note: "Visible públicamente y listo para reservas." },
};

const createEmptyForm = () => ({
  id: null,
  origin: "",
  destination: "",
  airline: "",
  flightNumber: "",
  price: "",
  departureDate: "",
  category: "",
  description: "",
  imageUrl: "",
  imageFilesDataUrls: [],
  features: [],
  status: "DRAFT",
});

const writeLocalCategories = (categories) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories || []));
};

const toInputDate = (value) => (value ? String(value).slice(0, 10) : "");
const toBackendDate = (value) => (value ? (String(value).includes("T") ? value : `${value}T00:00`) : "");
const normalizeStatus = (status) => (String(status || "").trim().toUpperCase() === "ACTIVE" ? "ACTIVE" : "DRAFT");
const isSystemCategory = (category) => String(category?.name || "").trim().toLowerCase() === "sin categoria";
const splitRoute = (name = "") => {
  const clean = String(name || "").replace(/^Vuelo\s+/i, "").trim();
  const parts = clean.split(/->/).map((part) => part.trim()).filter(Boolean);
  return { origin: parts[0] || "", destination: parts[1] || "" };
};
const buildPageItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const items = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  if (start > 2) items.push("...");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("...");
  items.push(total);
  return items;
};
const extractApiMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  return error?.message || fallback;
};
const extractApiFieldErrors = (error) => {
  const payload = error?.response?.data;
  return payload?.errors && typeof payload.errors === "object" ? payload.errors : {};
};
const validateFlightForm = (form) => {
  const errors = {};
  const origin = String(form.origin || "").trim();
  const destination = String(form.destination || "").trim();
  const airline = String(form.airline || "").trim();
  const flightNumber = String(form.flightNumber || "").trim().toUpperCase();
  const price = Number(form.price);
  const departureDate = form.departureDate ? new Date(`${form.departureDate}T00:00:00`) : null;
  if (!origin) errors.origin = "El origen es obligatorio.";
  else if (!LOCATION_PATTERN.test(origin)) errors.origin = "Ingresa un origen valido.";
  if (!destination) errors.destination = "El destino es obligatorio.";
  else if (!LOCATION_PATTERN.test(destination)) errors.destination = "Ingresa un destino valido.";
  if (!errors.origin && !errors.destination && origin.toLowerCase() === destination.toLowerCase()) errors.destination = "Origen y destino no pueden ser iguales.";
  if (!airline) errors.airline = "La aerolinea es obligatoria.";
  else if (!AIRLINE_PATTERN.test(airline)) errors.airline = "Ingresa una aerolinea valida.";
  if (!flightNumber) errors.flightNumber = "El numero de vuelo es obligatorio.";
  else if (!FLIGHT_NUMBER_PATTERN.test(flightNumber)) errors.flightNumber = "Usa un formato valido. Ej: AR1234 o AA-234.";
  if (!form.category) errors.category = "Selecciona una categoria.";
  if (!form.departureDate) errors.departureDate = "La fecha de salida es obligatoria.";
  else if (!departureDate || Number.isNaN(departureDate.getTime())) errors.departureDate = "Ingresa una fecha valida.";
  if (!form.price && form.price !== 0) errors.price = "El precio es obligatorio.";
  else if (!Number.isFinite(price) || price <= 0) errors.price = "El precio debe ser mayor a 0.";
  return errors;
};

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
  const [panelFeedback, setPanelFeedback] = useState(null);
  const [formFeedback, setFormFeedback] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [newFeature, setNewFeature] = useState({ title: "", icon: "" });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ title: "", description: "", imageUrl: "", icon: "" });
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryDeleteLoading, setCategoryDeleteLoading] = useState(false);
  const [categoryDeleteFeedback, setCategoryDeleteFeedback] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', background: '#0f172a', color: '#f8fafc' }}>
        <MdOutlinePublic style={{ fontSize: '4rem', color: '#3b82f6', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Acceso Restringido</h2>
        <p style={{ color: '#94a3b8', maxWidth: '400px', lineHeight: '1.6' }}>El panel de administración requiere una pantalla más grande para ofrecer una experiencia óptima. Por favor, accede desde una PC o tablet en modo horizontal.</p>
        <Link to="/" style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#3b82f6', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Volver al inicio</Link>
      </div>
    );
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [products, categoriesData, featuresResponse] = await Promise.all([
          productService.getAllProducts(),
          categoryService.getAll(),
          getFeatures(),
        ]);
        setVuelos(Array.isArray(products) ? products : []);
        const safeCategories = Array.isArray(categoriesData) ? categoriesData : [];
        setCategories(safeCategories);
        writeLocalCategories(safeCategories);
        setAvailableFeatures(Array.isArray(featuresResponse?.data) ? featuresResponse.data : []);
      } catch (error) {
        console.error(error);
        setBackendError("No se pudieron cargar los datos del panel.");
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (!editId || vuelos.length === 0) return;
    const vuelo = vuelos.find((item) => String(item.id) === String(editId));
    if (vuelo) handleEdit(vuelo);
  }, [location.search, vuelos]);

  useEffect(() => setPage(1), [query]);

  useEffect(() => {
    if (!categoryToDelete) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !categoryDeleteLoading) setCategoryToDelete(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [categoryDeleteLoading, categoryToDelete]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vuelos.filter((vuelo) => !q || [vuelo.id, vuelo.name, vuelo.country, vuelo.aerolinea, vuelo.numeroVuelo].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [query, vuelos]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(() => buildPageItems(safePage, pageCount), [safePage, pageCount]);
  const visibleVuelos = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);
  const statusMeta = STATUS_META[normalizeStatus(form.status)] || STATUS_META.DRAFT;

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const updateFormValue = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormFeedback(null);
  };

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setFormErrors({});
    setFormFeedback(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => resolve(loadEvent.target?.result);
      reader.readAsDataURL(file);
    }))).then((results) => {
      updateFormValue("imageFilesDataUrls", results.filter(Boolean));
      updateFormValue("imageUrl", "");
    });
  };

  const handleEdit = (vuelo) => {
    const route = splitRoute(vuelo.name);
    setEditingId(vuelo.id);
    setForm({
      id: vuelo.id,
      origin: route.origin || vuelo.origin || "",
      destination: route.destination || vuelo.destination || vuelo.country || "",
      airline: vuelo.aerolinea || vuelo.airline || "",
      flightNumber: vuelo.numeroVuelo || vuelo.flightNumber || "",
      price: vuelo.price || "",
      departureDate: toInputDate(vuelo.departureDate),
      category: vuelo.category?.id || vuelo.categoryId || "",
      description: vuelo.description || "",
      imageUrl: vuelo.image || vuelo.imageUrl || "",
      imageFilesDataUrls: Array.isArray(vuelo.imagesBase64) ? vuelo.imagesBase64 : [],
      features: Array.isArray(vuelo.features) ? vuelo.features.map((feature) => ({ id: feature.id, name: feature.name })) : [],
      status: normalizeStatus(vuelo.status),
    });
    setFormErrors({});
    setFormFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleCreateOrUpdate = async () => {
    const validationErrors = validateFlightForm(form);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setFormFeedback({ type: "error", message: "Corrige los campos marcados antes de guardar." });
      return;
    }

    const payload = {
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      airline: form.airline.trim(),
      flightNumber: form.flightNumber.trim().toUpperCase(),
      price: Number(form.price),
      departureDate: toBackendDate(form.departureDate),
      categoryId: form.category ? Number(form.category) : null,
      description: form.description,
      image: form.imageUrl || null,
      imagesBase64: form.imageFilesDataUrls || [],
      features: (form.features || []).map((feature) => ({ id: feature.id, name: feature.name })),
      status: normalizeStatus(form.status),
    };

    setFormSubmitting(true);
    try {
      const saved = form.id ? await productService.updateProduct(form.id, payload) : await productService.createProduct(payload);
      setVuelos((prev) => (form.id ? prev.map((vuelo) => (vuelo.id === form.id ? saved : vuelo)) : [saved, ...prev]));
      setFormFeedback({ type: "success", message: form.id ? "Vuelo actualizado correctamente." : "Vuelo creado correctamente." });
      resetForm();
    } catch (error) {
      const fieldErrors = extractApiFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) setFormErrors(fieldErrors);
      setFormFeedback({ type: "error", message: extractApiMessage(error, "No se pudo guardar el vuelo.") });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Seguro que quieres eliminar este vuelo?")) return;
    try {
      await productService.deleteProduct(id);
      setVuelos((prev) => prev.filter((vuelo) => vuelo.id !== id));
      setPanelFeedback({ type: "success", message: "Vuelo eliminado correctamente." });
      if (editingId === id) resetForm();
    } catch (error) {
      setPanelFeedback({ type: "error", message: extractApiMessage(error, "No se pudo eliminar el vuelo.") });
    }
  };

  const handleToggleStatus = async (vuelo) => {
    const nextStatus = normalizeStatus(vuelo.status) === "ACTIVE" ? "DRAFT" : "ACTIVE";
    setStatusUpdatingId(vuelo.id);
    try {
      const updated = await productService.updateProductStatus(vuelo.id, nextStatus);
      setVuelos((prev) => prev.map((item) => (item.id === vuelo.id ? updated : item)));
      if (editingId === vuelo.id) updateFormValue("status", normalizeStatus(updated.status));
      setPanelFeedback({ type: "success", message: nextStatus === "ACTIVE" ? "Vuelo publicado correctamente." : "Vuelo enviado a borrador." });
    } catch (error) {
      setPanelFeedback({ type: "error", message: extractApiMessage(error, "No se pudo actualizar el estado del vuelo.") });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleSaveFeature = async () => {
    if (!newFeature.title.trim()) return setPanelFeedback({ type: "error", message: "El titulo de la caracteristica es obligatorio." });
    if (!newFeature.icon) return setPanelFeedback({ type: "error", message: "Selecciona un icono para la caracteristica." });
    try {
      if (editingFeature?.id) {
        const response = await updateFeature(editingFeature.id, { name: newFeature.title.trim(), icon: newFeature.icon });
        const updated = response?.data;
        setAvailableFeatures((prev) => prev.map((feature) => (feature.id === updated.id ? updated : feature)));
      } else {
        const response = await createFeature({ name: newFeature.title.trim(), icon: newFeature.icon });
        const created = response?.data;
        setAvailableFeatures((prev) => [created, ...prev]);
      }
      setShowFeatureModal(false);
      setEditingFeature(null);
      setNewFeature({ title: "", icon: "" });
      setPanelFeedback({ type: "success", message: "Caracteristica guardada correctamente." });
    } catch (error) {
      setPanelFeedback({ type: "error", message: "No se pudo guardar la caracteristica." });
    }
  };

  const handleDeleteFeature = async (featureId) => {
    if (!window.confirm("Eliminar caracteristica?")) return;
    try {
      await deleteFeature(featureId);
      setAvailableFeatures((prev) => prev.filter((feature) => feature.id !== featureId));
      setForm((prev) => ({ ...prev, features: (prev.features || []).filter((feature) => feature.id !== featureId) }));
      setPanelFeedback({ type: "success", message: "Caracteristica eliminada correctamente." });
    } catch (error) {
      setPanelFeedback({ type: "error", message: extractApiMessage(error, "No se pudo eliminar la caracteristica.") });
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategory.title.trim()) return setPanelFeedback({ type: "error", message: "El titulo de la categoria es obligatorio." });
    try {
      const saved = await categoryService.createCategory({ name: newCategory.title.trim(), description: newCategory.description.trim(), imageUrl: newCategory.imageUrl || "", icon: newCategory.icon || "" });
      const updated = [saved, ...categories];
      setCategories(updated);
      writeLocalCategories(updated);
      updateFormValue("category", saved.id);
      setShowCategoryModal(false);
      setNewCategory({ title: "", description: "", imageUrl: "", icon: "" });
      setPanelFeedback({ type: "success", message: "Categoria creada correctamente." });
    } catch (error) {
      setPanelFeedback({ type: "error", message: extractApiMessage(error, "No se pudo crear la categoria.") });
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete?.id) return;
    if (isSystemCategory(categoryToDelete)) {
      setCategoryDeleteFeedback({ type: "error", message: "La categoria 'Sin categoria' es del sistema y no se puede eliminar." });
      setCategoryToDelete(null);
      return;
    }
    setCategoryDeleteLoading(true);
    setCategoryDeleteFeedback(null);
    try {
      await categoryService.deleteCategory(Number(categoryToDelete.id));
      setCategories((prev) => {
        const updated = prev.filter((category) => Number(category.id) !== Number(categoryToDelete.id));
        writeLocalCategories(updated);
        return updated;
      });
      setForm((prev) => ({ ...prev, category: Number(prev.category) === Number(categoryToDelete.id) ? "" : prev.category }));
      setCategoryDeleteFeedback({ type: "success", message: "Categoria eliminada correctamente." });
      setCategoryToDelete(null);
    } catch (error) {
      setCategoryDeleteFeedback({ type: "error", message: extractApiMessage(error, "No se pudo eliminar la categoria.") });
    } finally {
      setCategoryDeleteLoading(false);
    }
  };

  const handleJump = (sectionId) => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const clearLocalData = () => {
    if (!window.confirm("Limpiar cache local de categorias?")) return;
    localStorage.removeItem(CATEGORIES_KEY);
    setCategories([]);
    setPanelFeedback({ type: "success", message: "Cache local limpiado." });
  };

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
        <button type="button" className="admin-menu-link" onClick={() => handleJump("admin-products")}>Listado</button>
        <Link to="/administracion/usuarios" className="admin-menu-link">Usuarios</Link>
      </nav>
      <header className="admin-header">
        <div className="admin-header-main">
          <div className="admin-title-section">
            <h1>Administración de Vuelos</h1>
            <p>Gestiona vuelos, categorias y caracteristicas con validaciones consistentes.</p>
          </div>
          <button className="btn-new-entry" onClick={() => handleJump("admin-form")}>+ Nuevo vuelo</button>
        </div>
        {backendError && <div className="form-error">{backendError}</div>}
        {panelFeedback && <div className={`admin-feedback-message ${panelFeedback.type === "success" ? "is-success" : "is-error"}`}>{panelFeedback.message}</div>}
      </header>

      <section id="admin-features" className="admin-features-section">
        <div className="features-section-header">
          <h2>Caracteristicas registradas</h2>
          <div className="features-header-right">
            <span className="features-count">{availableFeatures.length} total</span>
            <button className="btn-new-feature" onClick={() => { setEditingFeature(null); setNewFeature({ title: "", icon: "" }); setShowFeatureModal(true); }}>+ Nueva</button>
          </div>
        </div>
        {availableFeatures.length === 0 ? <p className="no-data">No hay caracteristicas aun.</p> : (
          <table className="admin-table"><thead><tr><th>Nombre</th><th>Icono</th><th>ID</th><th style={{ textAlign: "center" }}>Acciones</th></tr></thead><tbody>
            {availableFeatures.map((feature) => (
              <tr key={feature.id}>
                <td>{feature.name}</td>
                <td><div className="feature-icon-cell"><span className="feature-icon-preview">{ICON_REGISTRY[feature.icon] ? React.createElement(ICON_REGISTRY[feature.icon]) : "-"}</span><span className="feature-icon-name">{feature.icon || "Sin icono"}</span></div></td>
                <td>{feature.id || "-"}</td>
                <td style={{ textAlign: "center" }}><button className="btn-edit" onClick={() => { setEditingFeature(feature); setNewFeature({ title: feature.name || "", icon: feature.icon || "" }); setShowFeatureModal(true); }}>Editar</button><button className="btn-delete" onClick={() => handleDeleteFeature(feature.id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody></table>
        )}
      </section>

      <section id="admin-categories" className="admin-features-section">
        <div className="features-section-header"><h2>Categorias registradas</h2><div className="features-header-right"><span className="features-count">{categories.length} total</span><button className="btn-new-feature" onClick={() => { setNewCategory({ title: "", description: "", imageUrl: "", icon: "" }); setShowCategoryModal(true); }}>+ Nueva</button></div></div>
        {categoryDeleteFeedback && <div className={`admin-feedback-message ${categoryDeleteFeedback.type === "success" ? "is-success" : "is-error"}`}>{categoryDeleteFeedback.message}</div>}
        {categories.length === 0 ? <p className="no-data">No hay categorias aun.</p> : (
          <table className="admin-table"><thead><tr><th>Icono</th><th>Nombre</th><th>Descripcion</th><th style={{ textAlign: "center" }}>Acciones</th></tr></thead><tbody>
            {categories.map((category) => { const Icon = ICON_REGISTRY[category.icon] || null; const systemCategory = isSystemCategory(category); return (
              <tr key={category.id || category.name}><td>{Icon ? <Icon /> : "-"}</td><td><div className="category-name-cell"><span>{category.name}</span>{systemCategory && <span className="category-system-badge">Sistema</span>}</div></td><td>{category.description || (systemCategory ? "Categoria reservada para respaldo del sistema." : "-")}</td><td style={{ textAlign: "center" }}>{systemCategory ? <button type="button" className="btn-delete btn-delete-category" disabled title="Categoria protegida del sistema"><span>Protegida</span></button> : <button type="button" className="btn-delete btn-delete-category" onClick={() => { setCategoryDeleteFeedback(null); setCategoryToDelete(category); }}><MdDeleteOutline /><span>Eliminar</span></button>}</td></tr>
            ); })}
          </tbody></table>
        )}
      </section>

      <main className="container">
        <section id="admin-form" className="admin-form">
          <h2>{editingId ? "Editar vuelo" : "Crear nuevo vuelo"}</h2>
          <p>Completa la informacion del vuelo y decide si queda en borrador o publicado.</p>
          <form className="admin-form-stacked" noValidate onSubmit={(event) => { event.preventDefault(); handleCreateOrUpdate(); }}>
            <div className="admin-status-banner"><div><span className={`status-pill ${normalizeStatus(form.status) === "ACTIVE" ? "active" : "draft"}`}>{statusMeta.label}</span><p className="status-context">{statusMeta.note}</p></div><button type="button" className="status-action-btn" onClick={() => updateFormValue("status", normalizeStatus(form.status) === "ACTIVE" ? "DRAFT" : "ACTIVE")}>{normalizeStatus(form.status) === "ACTIVE" ? "Enviar a borrador" : "Publicar"}</button></div>
            {formFeedback && <div className={`admin-feedback-message ${formFeedback.type === "success" ? "is-success" : "is-error"}`}>{formFeedback.message}</div>}

            <div className="form-section">
              <div className="form-section-header"><span className="section-icon text-blue" style={{ fontSize: "1.4rem", display: "flex", alignItems: "center" }}><MdFlightTakeoff /></span><h3>Informacion general</h3></div>
              <div className="grid-2">
                <label>Origen<input value={form.origin} onChange={(event) => updateFormValue("origin", event.target.value)} aria-invalid={Boolean(formErrors.origin)} />{formErrors.origin && <span className="field-error">{formErrors.origin}</span>}</label>
                <label>Destino<div className="input-with-icon"><span className="input-icon" style={{ fontSize: "1.2rem", display: "flex", alignItems: "center" }}><MdOutlinePublic /></span><input value={form.destination} onChange={(event) => updateFormValue("destination", event.target.value)} aria-invalid={Boolean(formErrors.destination)} /></div>{formErrors.destination && <span className="field-error">{formErrors.destination}</span>}</label>
                <label>Aerolinea<input value={form.airline} onChange={(event) => updateFormValue("airline", event.target.value)} aria-invalid={Boolean(formErrors.airline)} />{formErrors.airline && <span className="field-error">{formErrors.airline}</span>}</label>
                <label>Numero de vuelo<input value={form.flightNumber} onChange={(event) => updateFormValue("flightNumber", event.target.value.toUpperCase())} aria-invalid={Boolean(formErrors.flightNumber)} />{formErrors.flightNumber && <span className="field-error">{formErrors.flightNumber}</span>}</label>
                <label>Categoria<select value={form.category || ""} onChange={(event) => updateFormValue("category", Number(event.target.value))} aria-invalid={Boolean(formErrors.category)}><option value="">Selecciona una categoria...</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{formErrors.category && <span className="field-error">{formErrors.category}</span>}</label>
                <label>Precio (USD)<div className="input-with-icon"><span className="input-icon">$</span><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateFormValue("price", event.target.value)} aria-invalid={Boolean(formErrors.price)} /></div>{formErrors.price && <span className="field-error">{formErrors.price}</span>}</label>
                <label>Fecha de salida<div className="input-with-icon"><span className="input-icon" style={{ fontSize: "1.2rem", display: "flex", alignItems: "center" }}><MdOutlineCalendarToday /></span><input type="date" value={form.departureDate} onChange={(event) => updateFormValue("departureDate", event.target.value)} aria-invalid={Boolean(formErrors.departureDate)} /></div>{formErrors.departureDate && <span className="field-error">{formErrors.departureDate}</span>}</label>
                <label>Estado<select value={normalizeStatus(form.status)} onChange={(event) => updateFormValue("status", event.target.value)}><option value="DRAFT">Borrador</option><option value="ACTIVE">Activo</option></select></label>
              </div>
              <div className="grid-1" style={{ marginTop: "1rem" }}><label>Descripcion<textarea rows="4" value={form.description} onChange={(event) => updateFormValue("description", event.target.value)} /> <span className="field-help">Si la dejas vacia, el backend generara una descripcion base.</span></label></div>
              <div className="form-section-spaced" style={{ marginTop: "1rem" }}><label>Caracteristicas del vuelo</label>{availableFeatures.length === 0 ? <p className="no-data">No hay caracteristicas registradas para seleccionar.</p> : <div className="flight-chips-container">{availableFeatures.map((feature) => { const isSelected = (form.features || []).some((item) => item.id === feature.id); const Icon = ICON_REGISTRY[feature.icon] || null; return <button type="button" key={feature.id} className={`flight-chip ${isSelected ? "selected" : ""}`} onClick={() => setForm((prev) => ({ ...prev, features: isSelected ? (prev.features || []).filter((item) => item.id !== feature.id) : [...(prev.features || []), { id: feature.id, name: feature.name }] }))}>{Icon && <Icon className="flight-chip-icon" />}{feature.name}</button>; })}</div>}</div>
            </div>
            <div className="form-section" style={{ marginTop: "2rem" }}>
              <div className="form-section-header"><span className="section-icon text-blue" style={{ fontSize: "1.4rem", display: "flex", alignItems: "center" }}><MdOutlineImage /></span><h3>Imagenes del vuelo</h3></div>
              <div className="media-upload-area" onClick={() => fileInputRef.current?.click()}><div className="upload-icon-wrapper"><span style={{ fontSize: "2rem", display: "flex", alignItems: "center" }}><MdOutlineCloudUpload /></span></div><strong>Arrastra imagenes o haz click para cargarlas</strong><span style={{ marginBottom: "0.5rem", color: "#94a3b8" }}>PNG o JPG, hasta 10MB</span><input ref={fileInputRef} onChange={handleFilesChange} type="file" accept="image/*" multiple style={{ display: "none" }} /></div>
              <div className="media-previews" style={{ marginTop: "1rem" }}>{form.imageFilesDataUrls.map((src, index) => <div key={index} className="media-preview-item"><img src={src} alt={`preview-${index}`} /></div>)}{form.imageFilesDataUrls.length === 0 && form.imageUrl && <div className="media-preview-item"><img src={form.imageUrl} alt="url-preview" /></div>}<div className="media-preview-add" onClick={() => { const url = prompt("Agregar URL de imagen:"); if (url) { updateFormValue("imageUrl", url); updateFormValue("imageFilesDataUrls", []); } }}><span>+</span></div></div>
            </div>
            <div className="form-actions-stack" style={{ marginTop: "1.5rem" }}><button type="submit" className="btn btn-primary-wide" disabled={formSubmitting} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><MdFlightTakeoff style={{ fontSize: "1.2rem" }} /> {formSubmitting ? "Guardando..." : editingId ? "Actualizar vuelo" : "Crear vuelo"}</button><button type="button" className="btn btn-cancel-wide" onClick={resetForm} disabled={formSubmitting}>Cancelar</button></div>
          </form>
        </section>

        <section id="admin-products" className="admin-list">
          <input className="search-input" placeholder="Buscar por id, nombre, destino, aerolinea o numero..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <AdminProductsList vuelos={visibleVuelos} onEdit={handleEdit} onDelete={handleDelete} onToggleStatus={handleToggleStatus} statusUpdatingId={statusUpdatingId} />
          <div className="admin-list-footer"><span className="admin-list-counter">Mostrando {visibleVuelos.length} de {filtered.length} productos</span><div className="admin-pagination"><span className="admin-pagination-info">Pagina {safePage} de {pageCount}</span><div className="admin-pagination-controls"><button type="button" onClick={() => setPage(1)} disabled={safePage === 1}>Inicio</button><button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={safePage === 1}>Anterior</button><div className="admin-page-list">{pageItems.map((item, index) => item === "..." ? <span key={`ellipsis-${index}`} className="admin-page-ellipsis">...</span> : <button key={item} type="button" className={`admin-page-btn ${item === safePage ? "active" : ""}`} onClick={() => setPage(item)}>{item}</button>)}</div><button type="button" onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))} disabled={safePage === pageCount}>Siguiente</button></div></div></div>
        </section>
      </main>

      {showFeatureModal && <div className="feature-modal-overlay"><div className="feature-modal"><h2>{editingFeature ? "Editar caracteristica" : "Nueva caracteristica"}</h2><input type="text" placeholder="Titulo" value={newFeature.title} onChange={(event) => setNewFeature({ ...newFeature, title: event.target.value })} /><label style={{ display: "block", marginBottom: 6 }}>Icono</label><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><div style={{ width: 56, height: 56, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #eee" }}>{newFeature.icon && ICON_REGISTRY[newFeature.icon] ? React.createElement(ICON_REGISTRY[newFeature.icon]) : <span style={{ opacity: 0.6 }}>-</span>}</div><div style={{ fontSize: 14, color: "#444" }}>{newFeature.icon || "Ningun icono seleccionado"}</div></div><IconPicker value={newFeature.icon} onChange={(iconName) => setNewFeature({ ...newFeature, icon: iconName })} columns={6} /><div className="modal-buttons"><button onClick={() => setShowFeatureModal(false)}>Cancelar</button><button onClick={handleSaveFeature}>Guardar</button></div></div></div>}
      {categoryToDelete && <div className="feature-modal-overlay" onClick={() => !categoryDeleteLoading && setCategoryToDelete(null)}><div className="feature-modal category-delete-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="category-delete-badge"><MdDeleteOutline /></div><h2>Eliminar categoria?</h2><p className="category-delete-message">Estas a punto de eliminar la categoria <strong>"{categoryToDelete.name || "Sin nombre"}"</strong>.</p><p className="category-delete-note">Si todavia hay vuelos asociados, revisalos antes para no dejar datos ambiguos.</p><div className="modal-buttons category-delete-actions"><button type="button" className="category-delete-cancel" onClick={() => setCategoryToDelete(null)} disabled={categoryDeleteLoading}>Cancelar</button><button type="button" className="category-delete-confirm" onClick={handleConfirmDeleteCategory} disabled={categoryDeleteLoading}>{categoryDeleteLoading ? "Eliminando..." : "Confirmar eliminacion"}</button></div></div></div>}
      {showCategoryModal && <div className="feature-modal-overlay"><div className="feature-modal"><h2>Nueva categoria</h2><input type="text" placeholder="Titulo" value={newCategory.title} onChange={(event) => setNewCategory({ ...newCategory, title: event.target.value })} /><textarea placeholder="Descripcion" value={newCategory.description} onChange={(event) => setNewCategory({ ...newCategory, description: event.target.value })} /><div><label style={{ display: "block", marginBottom: 6 }}>Icono</label><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><div style={{ width: 56, height: 56, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #eee" }}>{newCategory.icon && ICON_REGISTRY[newCategory.icon] ? React.createElement(ICON_REGISTRY[newCategory.icon]) : <span style={{ opacity: 0.6 }}>-</span>}</div><div style={{ fontSize: 14, color: "#444" }}>{newCategory.icon || "Ningun icono seleccionado"}</div></div><IconPicker value={newCategory.icon} onChange={(iconName) => setNewCategory({ ...newCategory, icon: iconName })} columns={6} /></div><input type="text" placeholder="URL de imagen (opcional)" value={newCategory.imageUrl} onChange={(event) => setNewCategory({ ...newCategory, imageUrl: event.target.value })} /><div className="modal-buttons"><button onClick={() => setShowCategoryModal(false)}>Cancelar</button><button onClick={handleSaveCategory}>Guardar</button></div></div></div>}
    </div>
  );
}


