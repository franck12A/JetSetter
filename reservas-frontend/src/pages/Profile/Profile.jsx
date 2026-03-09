import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPlane, FaClock, FaCar,
  FaChevronLeft, FaPen, FaRegHeart, FaTicketAlt,
  FaCog, FaQuestionCircle, FaChevronRight
} from "react-icons/fa";
import { addFavorite, removeFavorite, getUserFavorites } from "../../services/favoritesApi";
import { getUserBookings, cancelBooking, createBooking } from "../../services/bookingsApi";
import productService from "../../services/productService";
import { getVueloImage } from "../../utils/images";
import "./Profile.css";

const icons = { FaPlane, FaClock, FaCar };
const hasImageData = (item) =>
  Boolean(
    item?.imagenUrl ||
    item?.imagenPrincipal ||
    item?.image ||
    (Array.isArray(item?.imagenesPais) && item.imagenesPais.length > 0) ||
    (Array.isArray(item?.imagesBase64) && item.imagesBase64.length > 0)
  );

const resolveProductId = (item) => {
  const raw = item?.productId ?? item?.id;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export default function Profile() {
  const [favorites, setFavorites] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [token] = useState(() => localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedToken = localStorage.getItem("token");

    if (!storedUser || !storedToken) {
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      getUserFavorites().catch(err => { console.error("Error fetching favorites:", err); return []; }),
      getUserBookings(storedUser.id).catch(err => { console.error("Error fetching bookings:", err); return []; })
    ]).then(async ([favsData, booksData]) => {
      const enrichedFavs = await Promise.all(
        (favsData || []).map(async (fav) => {
          if (hasImageData(fav)) return fav;
          const productId = resolveProductId(fav);
          if (!productId) return fav;
          try {
            const full = await productService.getById(productId);
            return full ? { ...fav, ...full } : fav;
          } catch {
            return fav;
          }
        })
      );

      const enrichedBookings = await Promise.all(
        (booksData || []).map(async (booking) => {
          const currentProduct = booking?.product || {};
          if (hasImageData(currentProduct) || hasImageData(booking)) return booking;
          const productId = resolveProductId(currentProduct) || resolveProductId(booking);
          if (!productId) return booking;
          try {
            const full = await productService.getById(productId);
            return full ? { ...booking, product: { ...currentProduct, ...full } } : booking;
          } catch {
            return booking;
          }
        })
      );

      setFavorites(enrichedFavs);
      setBookings(enrichedBookings);
    }).finally(() => setLoading(false));
  }, []); // 🔑 vacía: solo se ejecuta 1 vez


  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Favoritos
  const handleAddFavorite = async (productId) => {
    try {
      await addFavorite(productId);
      const updatedFavs = await getUserFavorites();
      setFavorites(updatedFavs);
    } catch (err) {
      console.error("Error adding favorite:", err);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      await removeFavorite(productId);
      setFavorites(prev => prev.filter(f => f.id !== productId && f.productId !== productId));
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  // Reservas
  const handleCreateBooking = async (productId, dateStr, passengers = 1) => {
    try {
      const booking = await createBooking({ userId: user.id, productId, dateStr, passengers });
      setBookings(prev => [...prev, booking]);
    } catch (err) {
      console.error("Error creating booking:", err);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await cancelBooking(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err) {
      console.error("Error cancelling booking:", err);
    }
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
    <div className="profile-page-container">
      {/* HEADER NAV */}
      <div className="profile-top-nav">
        <button className="ptn-back" onClick={() => navigate(-1)}>
          <FaChevronLeft />
        </button>
        <button className="ptn-logout" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <div className="profile-wrapper">
        {/* AVATAR INFO */}
        <div className="profile-user-info">
          <div className="pui-avatar-wrapper">
            <div className="pui-avatar">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <button className="pui-edit-btn"><FaPen /></button>
          </div>
          <h2 className="pui-name">{user.username || "Mi Perfil"}</h2>
          <p className="pui-email">{user.email || "sin correo"}</p>
        </div>

        {/* STATS */}
        <div className="profile-stats-grid">
          <div className="ps-card">
            <h3>{favorites.length}</h3>
            <span>FAVORITOS</span>
          </div>
          <div className="ps-card">
            <h3>{bookings.length}</h3>
            <span>RESERVAS</span>
          </div>
        </div>

        {/* FAVORITOS */}
        <section className="profile-content-section">
          <h3 className="pcs-title">❤️ Vuelos favoritos</h3>
          {favorites.length === 0 ? (
            <div className="pcs-empty-state">
              <div className="pcs-empty-icon"><FaRegHeart /></div>
              <p>No tienes vuelos favoritos aún.</p>
            </div>
          ) : (
            <div className="card-grid">
              {favorites.map((vuelo, idx) => {
                const IconComponent = icons[vuelo.iconName] || FaPlane;
                return (
                  <div key={`fav-${vuelo.id}-${idx}`} className="card flight-card">
                    <div className="flight-card-header">
                      <span className="badge badge-next">Favorito</span>
                      <img
                        src={getVueloImage(vuelo)}
                        alt={vuelo.name}
                        className="flight-img"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/assets/avionsito.png";
                        }}
                      />
                    </div>
                    <div className="flight-card-body">
                      <h5 className="flight-title">{vuelo.name}</h5>
                      <p className="flight-desc">{vuelo.description}</p>
                      <div className="flight-footer">
                        <IconComponent style={{ marginRight: 8 }} />
                        <span className="flight-price">${vuelo.price}</span>
                        <button className="btn-delete" onClick={() => handleRemoveFavorite(vuelo.id)}>❌ </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RESERVAS */}
        <section className="profile-content-section">
          <h3 className="pcs-title">✈️ Mis reservas</h3>
          {bookings.length === 0 ? (
            <div className="pcs-empty-state">
              <div className="pcs-empty-icon"><FaTicketAlt /></div>
              <p>No tienes reservas registradas.</p>
            </div>
          ) : (
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
                      <img
                        src={getVueloImage(vuelo)}
                        alt={vuelo.name}
                        className="flight-img"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/assets/avionsito.png";
                        }}
                      />
                    </div>
                    <div className="flight-card-body">
                      <h5 className="flight-title">{vuelo.name}</h5>
                      <p className="flight-meta-data">📅 {fechaVuelo.toLocaleDateString("es-AR")}</p>
                      <div className="flight-footer mt-2">
                        <span className="flight-price">${vuelo.price}</span>
                        <button className="btn-delete" onClick={() => handleCancelBooking(b.id)}>❌</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MENU */}
        <div className="profile-options-menu">
          <button className="pom-item">
            <div className="pom-item-left">
              <FaCog className="pom-icon" /> <span>Ajustes de cuenta</span>
            </div>
            <FaChevronRight className="pom-arrow" />
          </button>
          <button className="pom-item border-none">
            <div className="pom-item-left">
              <FaQuestionCircle className="pom-icon" /> <span>Centro de ayuda</span>
            </div>
            <FaChevronRight className="pom-arrow" />
          </button>
        </div>
      </div>
    </div>
  );
}
