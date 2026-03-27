import React, { useEffect, useState } from "react";
import productService from "../../services/productService";
import "./VuelosList.css";

function VuelosList() {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")) || null);


  useEffect(() => {
    const loadVuelos = async () => {
      setLoading(true);
      try {
        const data = await productService.getAllProducts();
        // Mapear si es necesario para la UI
        const vuelosData = data.map(p => ({
          ...p,
          image: p.imageUrl || "default.jpg",  // coincide con la propiedad usada en el <img>
          name: p.name,
          description: p.description,
          price: p.price,
        }));
        setVuelos(vuelosData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadVuelos();
  }, []);


  // 🔹 Cargar favoritos reales desde backend cuando hay usuario logueado
  useEffect(() => {
    if (!user || (!localStorage.getItem("token") && !user.token)) return;

    import("../../services/favoritesApi.js")
      .then(({ getUserFavorites }) => getUserFavorites())
      .then((data) => {
        const favoritesIds = data.map((f) => f.id || f.productId);
        const updatedUser = { ...user, favorites: favoritesIds };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser)); // Actualizar para que otras vistas lo vean
      })
      .catch((err) => console.error("Error al cargar favoritos:", err));
  }, []);

  // 🔹 Alternar favorito
  const toggleFavorite = async (vueloId) => {
    if (!user) return alert("Inicia sesión para agregar favoritos");

    const isFav = user.favorites?.includes(vueloId);

    try {
      const { addFavorite, removeFavorite } = await import("../../services/favoritesApi.js");
      if (isFav) {
        await removeFavorite(vueloId);
      } else {
        await addFavorite(vueloId);
      }

      const updatedUser = { ...user };
      if (isFav) {
        updatedUser.favorites = updatedUser.favorites.filter((id) => id !== vueloId);
      } else {
        updatedUser.favorites = [...(updatedUser.favorites || []), vueloId];
      }

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el favorito: " + err.message);
    }
  };

  if (loading) return <p className="vuelos-list-loading">Cargando vuelos...</p>;

  return (
    <div className="vuelos-list">
      <h2 className="vuelos-list-title">✈️ Vuelos disponibles</h2>
      <div className="vuelos-list-grid">
        {vuelos.map((vuelo) => (
          <div key={vuelo.id} className="vuelos-list-item">
            <div className="vuelos-list-card">
              <img
                src={`http://localhost:8080/images/${vuelo.image}`}
                className="vuelos-list-image"
                alt={vuelo.name}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="vuelos-list-body">
                <h5 className="vuelos-list-name">{vuelo.name}</h5>
                <p className="vuelos-list-desc">{vuelo.description}</p>
                <p className="vuelos-list-price">${vuelo.price}</p>

                {user && (
                  <button
                    className={`vuelos-list-fav-btn ${user.favorites?.includes(vuelo.id)
                      ? "is-active"
                      : ""
                      }`}
                    onClick={() => toggleFavorite(vuelo.id)}
                  >
                    {user.favorites?.includes(vuelo.id)
                      ? "❤️ Favorito"
                      : "🤍 Agregar a Favoritos"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VuelosList;
