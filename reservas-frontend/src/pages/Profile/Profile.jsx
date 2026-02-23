import React, { useEffect, useState } from "react";
import { FaPlane, FaClock, FaCar } from "react-icons/fa";
import "./Profile.css";

function normalizeImage(src) {
  if (!src) return "/assets/placeholder.jpg";
  if (src.startsWith("http") || src.startsWith("/")) return src;
  return `/products/images/${src}`;
}

const icons = { FaPlane, FaClock, FaCar };

export default function Profile() {
  const [favorites, setFavorites] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [token] = useState(() => localStorage.getItem("token"));




useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const storedToken = localStorage.getItem("token");

  if (!storedUser || !storedToken) return;

  setLoading(true);

  // Favoritos
  fetch("http://localhost:8080/api/favorites", {
    headers: { "Authorization": `Bearer ${storedToken}` }
  })
    .then(res => res.json())
    .then(data => setFavorites(data))
    .catch(err => console.error(err));

  // Reservas
  fetch("http://localhost:8080/api/bookings/user", {
    headers: { "Authorization": `Bearer ${storedToken}` }
  })
    .then(res => res.json())
    .then(data => setBookings(data))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
}, []); // 🔑 vacía: solo se ejecuta 1 vez


  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Favoritos
  const handleAddFavorite = (productId) => {
    fetch("http://localhost:8080/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    })
      .then(res => res.json())
      .then(fav => setFavorites(prev => [...prev, fav]))
      .catch(err => console.error(err));
  };

  const handleRemoveFavorite = (productId) => {
    fetch("http://localhost:8080/api/favorites", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    })
      .then(() => setFavorites(prev => prev.filter(f => f.id !== productId)))
      .catch(err => console.error(err));
  };

  // Reservas
  const handleCreateBooking = (productId, dateStr, passengers = 1) => {
    fetch("http://localhost:8080/api/bookings/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ productId, dateStr, passengers })
    })
      .then(res => res.json())
      .then(booking => setBookings(prev => [...prev, booking]))
      .catch(err => console.error(err));
  };

  const handleCancelBooking = (bookingId) => {
    fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(() => setBookings(prev => prev.filter(b => b.id !== bookingId)))
      .catch(err => console.error(err));
  };

  if (!user) return (
    <div className="profile-container">
      <div className="profile-card text-center">
        <h3>Debes iniciar sesión para ver tu perfil</h3>
        <a href="/login" className="btn-logout mt-3">Ir al login</a>
      </div>
    </div>
  );

  if (loading) return (
    <div className="profile-container">
      <div className="profile-card text-center">
        <p>Cargando tus datos...</p>
      </div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* HEADER */}
        <div className="profile-header">
          <div className="profile-avatar">{user.username?.charAt(0).toUpperCase() || "U"}</div>
          <div className="profile-info">
            <h2>{user.username}</h2>
            <p className="email">{user.email || "sin correo"}</p>
            <div className="profile-stats">
              <div><span>{favorites.length}</span><small>Favoritos</small></div>
              <div><span>{bookings.length}</span><small>Reservas</small></div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>

        {/* FAVORITOS */}
        <section className="profile-section mb-5">
          <h3>❤️ Vuelos favoritos</h3>
          {favorites.length === 0 ? <p className="no-favs">No tienes vuelos favoritos aún.</p> :
            <div className="card-grid">
              {favorites.map((vuelo, idx) => {
                const IconComponent = icons[vuelo.iconName] || FaPlane;
                return (
                  <div key={`fav-${vuelo.id}-${idx}`} className="card flight-card">
                    <div className="flight-card-header">
                      <span className="badge badge-next">Favorito</span>
                      <img src={normalizeImage(vuelo.image)} alt={vuelo.name} className="flight-img" />
                    </div>
                    <div className="flight-card-body">
                      <h5 className="flight-title">{vuelo.name}</h5>
                      <p className="flight-desc">{vuelo.description}</p>
                      <div className="flight-footer">
                        <IconComponent style={{ marginRight: 8 }} />
                        <span className="flight-price">${vuelo.price}</span>
                        <button className="btn-delete" onClick={() => handleRemoveFavorite(vuelo.id)}>❌ Eliminar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </section>

        {/* RESERVAS */}
        <section className="profile-section">
          <h3>✈️ Mis reservas</h3>
          {bookings.length === 0 ? <p className="no-favs">No tienes reservas registradas.</p> :
            <div className="card-grid">
              {bookings.map((b, idx) => {
                const vuelo = b.product || b;
                const fechaVuelo = new Date(b.travelDate ?? b.dateStr);
                const esFuturo = fechaVuelo > new Date();
                return (
                  <div key={`book-${b.id}-${idx}`} className="card flight-card">
                    <div className="flight-card-header">
                      <span className={`badge ${esFuturo ? "badge-next" : "badge-past"}`}>
                        {esFuturo ? "Próximo vuelo" : "Completado"}
                      </span>
                      <img src={normalizeImage(vuelo.image)} alt={vuelo.name} className="flight-img" />
                    </div>
                    <div className="flight-card-body">
                      <h5 className="flight-title">{vuelo.name}</h5>
                      <p className="flight-desc">{vuelo.description}</p>
                      <div className="flight-meta">
                        <p>🛫 Origen: {vuelo.origen || "Desconocido"}</p>
                        <p>🛬 Destino: {vuelo.destino || "Desconocido"}</p>
                        <p>📅 {fechaVuelo.toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})}</p>
                      </div>
                      <div className="flight-footer">
                        <span className="flight-price">${vuelo.price}</span>
                        <button className="btn-delete" onClick={() => handleCancelBooking(b.id)}>❌ Cancelar reserva</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </section>
      </div>
    </div>
  );
}
