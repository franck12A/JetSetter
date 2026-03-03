// src/pages/AdminPanel/AdminPanel.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import "./AdminPanel.css";
import AdminProductsList from "../../components/AdminProductsList/AdminProductsList";
import IconPicker from "../../components/IconPicker/IconPicker";
import { ICON_REGISTRY } from "../../utils/iconRegistry";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";

// --- LocalStorage helpers para features y categorías ---
const FEATURES_KEY = "features_local";
const CATEGORIES_KEY = "categories_local";

function readLocalFeatures() {
  try {
    const raw = localStorage.getItem(FEATURES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error parseando features:", err);
    return [];
  }
}
function writeLocalFeatures(features) {
  try {
    localStorage.setItem(FEATURES_KEY, JSON.stringify(features));
  } catch (err) {
    console.error("Error guardando features:", err);
  }
}
function writeLocalCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export default function AdminPanel() {
  const [vuelos, setVuelos] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [editingId, setEditingId] = useState(null);
  const [backendError, setBackendError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // --- Features ---
  const [availableFeatures, setAvailableFeatures] = useState(() => {
    const features = readLocalFeatures();
    return Array.from(new Map(features.map(f => [f.id, f])).values());
  });
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [newFeature, setNewFeature] = useState({ title: "", description: "", type: "" });

  // --- Categories ---
  const [categories, setCategories] = useState(() => {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ title: "", description: "", imageUrl: "", icon: "" });

  // --- Formulario vuelo ---
  const fileInputRef = useRef(null);
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
    images: []
  });

  // --- Detectar pantalla móvil ---
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

// --- Cargar vuelos desde backend ---
useEffect(() => {
  const loadVuelos = async () => {
    try {
      const data = await productService.getAllProducts(); // <- método que definimos en productService
      setVuelos(data);
    } catch (err) {
      console.error("Error cargando vuelos:", err);
      setBackendError("No se pudieron cargar los vuelos desde el backend.");
    }
  };
  loadVuelos();
}, []);
// --- Cargar categorías desde backend ---
useEffect(() => {
  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll(); // <- método que definimos en categoryService
      setCategories(data);
      writeLocalCategories(data);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };
  loadCategories();
}, []);

  // --- Manejo de edición desde query string ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (editId && vuelos.length > 0) {
      const vuelo = vuelos.find((v) => String(v.id) === String(editId));
      if (vuelo) handleEdit(vuelo);
    }
  }, [location.search, vuelos]);

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
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((results) => setForm((f) => ({ ...f, imageFilesDataUrls: results, imageUrl: "" })));
  };

  // --- Crear o actualizar vuelo usando productService ---
  const handleCreateOrUpdate = async (product) => {
    if (!product.name.trim() || !product.country.trim() || !product.price || !product.departureDate || !product.categoryId) {
      return alert("Faltan campos obligatorios.");
    }

    try {
      const data = product.id
        ? await productService.updateProduct(product.id, product)
        : await productService.createProduct(product);

      setVuelos((prev) => {
        if (product.id) return prev.map((v) => (v.id === product.id ? data : v));
        return [...prev, data];
      });

      resetForm();
      alert("✅ Vuelo guardado correctamente");
    } catch (err) {
      console.error(err);
      alert("❌ Error al guardar el vuelo: " + err.message);
    }
  };

  // --- Borrar vuelo usando productService ---
  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que querés eliminar este vuelo?")) return;
    try {
      await productService.deleteProduct(id);
      setVuelos((prev) => prev.filter((v) => v.id !== id));
      alert("✅ Vuelo eliminado correctamente");
    } catch (err) {
      console.error(err);
      alert("❌ Error borrando vuelo: " + err.message);
    }
  };

  const handleEdit = (vuelo) => {
    setEditingId(vuelo.id);
    setForm({
      id: vuelo.id,
      name: vuelo.name || "",
      country: vuelo.country || "",
      price: vuelo.price || "",
      departureDate: vuelo.departureDate || "",
      category: vuelo.categoryId || "",
      description: vuelo.description || "",
      imageUrl: vuelo.imageUrl || "",
      imageFilesDataUrls: vuelo.imagesBase64 || [],
      features: vuelo.features || [],
      images: vuelo.images || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Filtrado y paginación ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vuelos.filter((v) => {
      if (!q) return true;
      return String(v.id).toLowerCase().includes(q) ||
        (v.name || "").toLowerCase().includes(q) ||
        (v.country || "").toLowerCase().includes(q);
    });
  }, [vuelos, query]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / perPage)), [filtered, perPage]);
  const paginated = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  if (isMobile) return (
    <div className="admin-mobile-warning">
      <h2>⚠️ Panel no disponible en dispositivos móviles</h2>
      <p>Por favor, accedé desde una computadora o tablet.</p>
    </div>
  );

 return (
   <>

     {/* CONTENEDOR GENERAL */}
     <div className="admin-container">
       {/* TOP NAVIGATION BAR */}
       <div className="admin-top-bar">
         <div className="admin-logo">
          <img src="/assets/logoJettSeter.png" alt="JetSetter Logo" className="admin-logo-img" />
          <span style={{color: '#3b82f6', fontWeight: '700'}}>JetSetter</span> <span style={{color: '#000', fontWeight: '700'}}>Admin</span>
         </div>
         <div className="admin-top-actions">
           <Link to="/" className="btn-top-action btn-view">Ver sitio</Link>
           <button
             className="btn-top-action btn-clear"
             onClick={() => {
               if (window.confirm("¿Limpiar localStorage?")) {
                 localStorage.removeItem("features_local");
                 localStorage.removeItem("categories_local");
                 setVuelos([]);
                 setAvailableFeatures([]);
                 setCategories([]);
                 alert("✅ LocalStorage limpiado");
               }
             }}
           >
             Limpiar
           </button>
         </div>
       </div>

       {/* HEADER PRINCIPAL */}
       <header className="admin-header">
         <div className="admin-header-main">
           <div className="admin-title-section">
             <h1>Administración de Vuelos</h1>
             <p>Gestiona el inventario de vuelos y características.</p>
           </div>
         </div>

         {backendError && <div className="form-error">{backendError}</div>}
       </header>

       {/* LISTA DE FEATURES */}
       <section className="admin-features-section">
         <div className="features-section-header">
           <h2>Características registradas</h2>
           <div className="features-header-right">
             <span className="features-count">{availableFeatures.length} total</span>
             <button className="btn-new-feature" onClick={() => {
               setEditingFeature(null);
               setNewFeature({ title: "", description: "", type: "" });
               setShowFeatureModal(true);
             }}>+ Nueva</button>
           </div>
         </div>

         {availableFeatures.length === 0 && <p className="no-data">No hay características aún.</p>}

         {availableFeatures.length > 0 && (
           <table className="admin-table">
             <thead>
               <tr>
                 <th>Nombre</th>
                 <th>Descripción</th>
                 <th style={{ textAlign: "center" }}>Acciones</th>
               </tr>
             </thead>

             <tbody>
              {availableFeatures.map((feat, index) => (
                <tr key={`feat-${feat.id}-${feat.name}-${index}`}>


                   <td>{feat.name}</td>
                   <td>{feat.description}</td>
                   <td style={{ textAlign: "center" }}>
                     <button
                       onClick={() => {
                         setEditingFeature(feat);
                         setNewFeature({
                           title: feat.name,
                           description: feat.description,
                           type: feat.type || "text",
                         });
                         setShowFeatureModal(true);
                       }}
                       className="btn-edit"
                     >
                       Editar
                     </button>

                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar característica?")) {
                        // Filtrar la característica eliminada
                        const filtered = availableFeatures.filter((x) => x.id !== feat.id);
                        setAvailableFeatures(filtered);
                        writeLocalFeatures(filtered);


                     // Quitar la característica de todos los vuelos
                     setVuelos((prev) =>
                       prev.map((v) => ({
                         ...v,
                         features: Array.isArray(v.features)
                           ? v.features.filter((id) => id !== feat.id)
                           : [], // si no existe features, se inicializa vacío
                       }))
                     );

                      }
                    }}
                    className="btn-delete"
                  >
                    Eliminar
                  </button>

                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         )}
       </section>

       {/* FORM Y LISTA DE PRODUCTOS */}
       <main className="container">
         <section className="admin-form">
           <h2>{editingId ? "Editar vuelo" : "Crear nuevo vuelo"}</h2>
           <p>Completa todos los campos para publicar un nuevo destino.</p>

           <form
             onSubmit={(e) => {
               e.preventDefault(); // evita recarga de página
               handleCreateOrUpdate({
                 id: form.id,
                 name: form.name,
                 country: form.country,
                 price: Number(form.price),
                 departureDate: form.departureDate,
                 categoryId: form.category,
                 description: form.description,
                 features: form.features || [],
                 imageUrl: form.imageUrl || null,
                 imagesBase64: form.imageFilesDataUrls || [],
               });
             }}
           >

             <div className="grid-2">
               <label>
                 Nombre del Vuelo
                 <input
                   placeholder="Ej. Vuelo Madrid - Tokyo"
                   value={form.name}
                   onChange={(e) =>
                     setForm({ ...form, name: e.target.value })
                   }
                   required
                 />
               </label>

               <label>
                 País de Destino
                 <input
                   placeholder="Ej. España"
                   value={form.country}
                   onChange={(e) =>
                     setForm({ ...form, country: e.target.value })
                   }
                   required
                 />
               </label>

               <label>
                 Precio (USD)
                 <input
                   type="number"
                   min="0"
                   step="0.01"
                   placeholder="$ 0.00"
                   value={form.price}
                   onChange={(e) =>
                     setForm({ ...form, price: e.target.value })
                   }
                   required
                 />
               </label>

               <label>
                 Fecha de salida
                 <input
                   type="date"
                   value={form.departureDate}
                   onChange={(e) =>
                     setForm({ ...form, departureDate: e.target.value })
                   }
                   required
                 />
               </label>

             <label>
               Categoría
         <select
           value={Number(form.category)}
           onChange={(e) => setForm({ ...form, category: Number(e.target.value) })}
         >
           <option value="">Seleccionar categoría...</option>
           {categories.map(c => (
             <option key={`cat-${c.id}`} value={Number(c.id)}>
               {c.name} {/* <-- antes era c.title */}
             </option>
           ))}
         </select>





             </label>

               <label>
                 Descripción del Vuelo
                 <textarea
                   rows="3"
                   placeholder="Detalles del trayecto y servicios..."
                   value={form.description}
                   onChange={(e) =>
                     setForm({ ...form, description: e.target.value })
                   }
                 />
               </label>

               {/* NUEVO BLOQUE DINÁMICO DE CARACTERÍSTICAS */}
               <label>
                 Características del vuelo
                 <div className="features-list">
                   {availableFeatures.length === 0 && (
                     <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                       No hay características creadas. Crealas desde el botón
                       “Agregar característica”.
                     </p>
                   )}

 {availableFeatures.map((feat, index) => { // <--- agregamos index aquí
   const selected = (form.features || []).find((f) => f.id === feat.id);

   return (
 <div key={`feat-item-${feat.id || index}-${feat.name}`} className="feature-item">

                         <label>
                           <input
                             type="checkbox"
                             checked={!!selected}
                             onChange={(e) => {
                               if (e.target.checked) {
                                 setForm((f) => ({
                                   ...f,
                                   features: [
                                     ...f.features,
                                     {
                                       id: feat.id,
                                       name: feat.name,
                                       type: feat.type || "text",
                                       value: "",
                                     },
                                   ],
                                 }));
                               } else {
                                 setForm((f) => ({
                                   ...f,
                                   features: f.features.filter(
                                     (x) => x.id !== feat.id
                                   ),
                                 }));
                               }
                             }}
                           />
                           {feat.name} ({feat.type})
                         </label>

                         {selected && (
                           <div className="feature-input">
                             {feat.type === "text" && (
                               <input
                                 type="text"
                                 placeholder="Texto"
                                 value={selected.value || ""}
                                 onChange={(e) => {
                                   setForm((f) => ({
                                     ...f,
                                     features: f.features.map((x) =>
                                       x.id === feat.id
                                         ? { ...x, value: e.target.value }
                                         : x
                                     ),
                                   }));
                                 }}
                               />
                             )}
                             {feat.type === "number" && (
                               <input
                                 type="number"
                                 placeholder="Número"
                                 value={selected.value || ""}
                                 onChange={(e) => {
                                   setForm((f) => ({
                                     ...f,
                                     features: f.features.map((x) =>
                                       x.id === feat.id
                                         ? { ...x, value: e.target.value }
                                         : x
                                     ),
                                   }));
                                 }}
                               />
                             )}
                             {feat.type === "date" && (
                               <input
                                 type="date"
                                 value={selected.value || ""}
                                 onChange={(e) => {
                                   setForm((f) => ({
                                     ...f,
                                     features: f.features.map((x) =>
                                       x.id === feat.id
                                         ? { ...x, value: e.target.value }
                                         : x
                                     ),
                                   }));
                                 }}
                               />
                             )}
                             {feat.type === "textarea" && (
                               <textarea
                                 placeholder="Descripción"
                                 value={selected.value || ""}
                                 onChange={(e) => {
                                   setForm((f) => ({
                                     ...f,
                                     features: f.features.map((x) =>
                                       x.id === feat.id
                                         ? { ...x, value: e.target.value }
                                         : x
                                     ),
                                   }));
                                 }}
                               />
                             )}
                             {feat.type === "boolean" && (
                               <select
                                 value={selected.value || ""}
                                 onChange={(e) => {
                                   setForm((f) => ({
                                     ...f,
                                     features: f.features.map((x) =>
                                       x.id === feat.id
                                         ? { ...x, value: e.target.value }
                                         : x
                                     ),
                                   }));
                                 }}
                               >
                                 <option value="">Seleccionar</option>
                                 <option value="true">Sí</option>
                                 <option value="false">No</option>
                               </select>
                             )}
                           </div>
                         )}
                       </div>
                     );
                   })}
                 </div>
               </label>

               <label>
                 Imagen (URL)
                 <input
                   value={form.imageUrl}
                   onChange={(e) =>
                     setForm({
                       ...form,
                       imageUrl: e.target.value,
                       imageFilesDataUrls: [],
                     })
                   }
                   placeholder="https://url-de-la-imagen.com"
                 />
               </label>

               <label>
                 Subir imagen
                 <input
                   ref={fileInputRef}
                   onChange={handleFilesChange}
                   type="file"
                   accept="image/*"
                   multiple
                 />
               </label>
             </div>

             <div className="preview">
               {form.imageFilesDataUrls.length > 0 ? (
                 form.imageFilesDataUrls.map((src, i) => (
                   <img key={i} src={src} alt={`preview-${i}`} />
                 ))
               ) : form.imageUrl ? (
                 <img src={form.imageUrl} alt="url-preview" />
               ) : (
                 <div>Sin imagen</div>
               )}
             </div>

             <div
               style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
             >
               <button type="submit" className="btn btn-primary">
                 {editingId ? "Guardar cambios" : "Crear vuelo"}
               </button>

               {editingId && (
                 <button
                   type="button"
                   className="btn btn-secondary"
                   onClick={resetForm}
                 >
                   Cancelar
                 </button>
               )}
             </div>
           </form>
         </section>

         <section className="admin-list">
           <AdminProductsList
             vuelos={paginated}
             onEdit={handleEdit}
             onDelete={handleDelete}
             page={page}
             setPage={setPage}
             perPage={perPage}
             totalPages={totalPages}
           />
         </section>
       </main>

       {/* MODAL DE FEATURES */}
       {showFeatureModal && (
         <div className="feature-modal-overlay">
           <div className="feature-modal">
             <h2>{editingFeature ? "Editar característica" : "Nueva característica"}</h2>

             <input
               type="text"
               placeholder="Título"
               value={newFeature.title}
               onChange={(e) =>
                 setNewFeature({ ...newFeature, title: e.target.value })
               }
             />

             <textarea
               placeholder="Descripción"
               value={newFeature.description}
               onChange={(e) =>
                 setNewFeature({ ...newFeature, description: e.target.value })
               }
             />

             <select
               value={newFeature.type || ""}
               onChange={(e) =>
                 setNewFeature({ ...newFeature, type: e.target.value })
               }
             >
               <option value="">Tipo...</option>
               <option value="text">Texto</option>
               <option value="number">Número</option>
               <option value="date">Fecha</option>
               <option value="textarea">Descripción</option>
               <option value="boolean">Sí/No</option>
             </select>

             <div className="modal-buttons">
               <button onClick={handleCloseFeatureModal}>Cancelar</button>
             <button onClick={handleSaveFeature}>Guardar</button>
             </div>
           </div>



         </div>
       )}

    {showCategoryModal && (
      <div className="feature-modal-overlay">
        <div className="feature-modal">
          <h2>{editingCategory ? "Editar categoría" : "Nueva categoría"}</h2>

          <input
            type="text"
            placeholder="Título"
            value={newCategory.title}
            onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
          />

          <textarea
            placeholder="Descripción"
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          />

          <div style={{ marginTop: 8 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Elegir ícono (en lugar de subir imagen)</label>

            {/* Muestra el icono actualmente seleccionado */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: "#fff", border: "1px solid #eee"
              }}>
                {newCategory.icon ? React.createElement(ICON_REGISTRY[newCategory.icon]) : <span style={{opacity:0.6}}>—</span>}
              </div>
              <div style={{ fontSize: 14, color: "#444" }}>
                {newCategory.icon || "Ningún ícono seleccionado"}
              </div>
            </div>

            {/* IconPicker */}
            <IconPicker
              value={newCategory.icon}
              onChange={(iconName) => setNewCategory({ ...newCategory, icon: iconName })}
              columns={6}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label>URL de imagen (opcional)</label>
            <input
              type="text"
              placeholder="URL de imagen (si querés override)"
              value={newCategory.imageUrl}
              onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
            />
          </div>

          <div className="modal-buttons" style={{ marginTop: 12 }}>
  <button
    onClick={async () => {
      if (!newCategory.title.trim())
        return alert("El título es obligatorio.");

    const categoryObj = {
      id: editingCategory?.id || null,
      name: newCategory.title, // aquí cambiamos title a name
      description: newCategory.description,
      imageUrl: newCategory.imageUrl,
      icon: newCategory.icon || "",
    };


      // Guardar en backend
       const savedCategory = await categoryService.saveCategory(categoryObj, token);
      if (!savedCategory) return; // si falla, salimos

      // Actualizar estado local de categorías
      const updatedCategories = editingCategory
        ? categories.map((c) =>
            c.id === editingCategory.id ? savedCategory : c
          )
        : [...categories, savedCategory];

      setCategories(updatedCategories);
      writeLocalCategories(updatedCategories); // opcional si querés localStorage

      // 🔹 Actualizar el vuelo actualmente en edición para que seleccione la nueva categoría
      setForm((f) => ({ ...f, category: savedCategory.id }));

      // Cerrar modal y reset
      setShowCategoryModal(false);
      setEditingCategory(null);
      setNewCategory({ title: "", description: "", imageUrl: "", imageFile: null, icon: "" });
    }}
  >
    Guardar
  </button>


          </div>
        </div>
      </div>
    )}
     </div>
   </>
  );
}
