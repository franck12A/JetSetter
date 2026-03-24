import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPlane, FaClock, FaCar,
  FaChevronLeft, FaPen, FaRegHeart, FaTicketAlt, FaHeart, FaCalendarAlt, FaPlaneDeparture, FaTrashAlt,
  FaCog, FaQuestionCircle, FaChevronRight, FaStar, FaRegStar
} from "react-icons/fa";
import { addFavorite, removeFavorite, getUserFavorites } from "../../services/favoritesApi";
import { getUserBookings, cancelBooking, createBooking } from "../../services/bookingsApi";
import productService from "../../services/productService";
import { createReview, getProductReviews } from "../../services/reviewsApi";
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

const formatBookingDate = (value) => {
  if (!value) return "Fecha pendiente";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fecha pendiente";
  return parsed.toLocaleDateString("es-AR");
};

const parseDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const isBookingFinalized = (booking) => {
  if (!booking) return false;
  const status = String(booking.status || "").trim().toUpperCase();
  if (status) {
    if (["FINALIZADA", "FINALIZADO", "COMPLETADA", "COMPLETADO", "COMPLETED"].includes(status)) {
      return true;
    }
    if (status.includes("CANCEL")) {
      return false;
    }
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const travelDate = parseDateOnly(booking.travelDate || booking.travel_date);
  if (travelDate) return travelDate <= today;
  const bookingDate = parseDateOnly(booking.bookingDate || booking.booking_date);
  if (bookingDate) return bookingDate <= today;
  return false;
};

const getStoredToken = () => {
  const directToken = localStorage.getItem("token");
  if (directToken && directToken !== "null" && directToken !== "undefined") {
    return directToken.startsWith("Bearer ") ? directToken.slice(7) : directToken;
  }
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userToken = storedUser?.token;
    if (!userToken || userToken === "null" || userToken === "undefined") return null;
    return userToken.startsWith("Bearer ") ? userToken.slice(7) : userToken;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const payload = JSON.parse(atob(payloadBase64));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

export default function Profile() {
  const [favorites, setFavorites] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [token] = useState(() => localStorage.getItem("token"));
  const [reviewsByProduct, setReviewsByProduct] = useState({});
  const [reviewForms, setReviewForms] = useState({});
  const [reviewStatus, setReviewStatus] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
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
      getUserBookings().catch(err => { console.error("Error fetching bookings:", err); return []; })
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
  }, []); // vac\u00eda: solo se ejecuta 1 vez

  useEffect(() => {
    if (!user || bookings.length === 0) {
      setReviewsByProduct({});
      return;
    }

    const productIds = Array.from(
      new Set(
        bookings
          .map((booking) => resolveProductId(booking?.product || booking))
          .filter(Boolean)
      )
    );

    if (!productIds.length) {
      setReviewsByProduct({});
      return;
    }

    let isMounted = true;
    setReviewsLoading(true);

    Promise.all(
      productIds.map((id) =>
        getProductReviews(id)
          .then((data) => ({ id, data }))
          .catch((err) => {
          console.error("Error cargando rese\u00f1as:", err);
            return { id, data: [] };
          })
      )
    )
      .then((results) => {
        if (!isMounted) return;
        const nextReviews = {};
        const nextForms = {};
        results.forEach(({ id, data }) => {
          const myReview = (data || []).find((review) => Number(review?.userId) === Number(user.id));
          if (myReview) {
            nextReviews[id] = myReview;
            nextForms[id] = {
              rating: myReview.rating || 0,
              comment: myReview.comment || "",
            };
          }
        });
        setReviewsByProduct(nextReviews);
        setReviewForms((prev) => ({ ...prev, ...nextForms }));
      })
      .finally(() => {
        if (isMounted) setReviewsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookings, user]);



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

  const updateReviewForm = (productId, patch) => {
    setReviewForms((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || { rating: 0, comment: "" }), ...patch },
    }));
  };

  const handleSubmitReview = async (productId) => {
    const tokenValue = getStoredToken();
    if (!tokenValue || isTokenExpired(tokenValue)) {
      setReviewStatus((prev) => ({
        ...prev,
        [productId]: { type: "error", message: "Tu sesi\u00f3n expir\u00f3. Inici\u00e1 sesi\u00f3n nuevamente." },
      }));
      navigate("/login");
      return;
    }

    const form = reviewForms[productId] || {};
    const rating = Number(form.rating) || 0;
    const comment = form.comment || "";

    if (!rating) {
      setReviewStatus((prev) => ({
        ...prev,
        [productId]: { type: "error", message: "Seleccion\u00e1 una puntuaci\u00f3n." },
      }));
      return;
    }

    setReviewStatus((prev) => ({
      ...prev,
      [productId]: { type: "loading", message: "Guardando..." },
    }));

    try {
      const newReview = await createReview({
        productId: String(productId),
        rating,
        comment,
      });
      setReviewsByProduct((prev) => ({ ...prev, [productId]: newReview }));
      setReviewStatus((prev) => ({
        ...prev,
        [productId]: { type: "success", message: "Rese\u00f1a guardada." },
      }));
    } catch (err) {
      setReviewStatus((prev) => ({
        ...prev,
        [productId]: {
          type: "error",
          message: err?.message || "No se pudo guardar la rese\u00f1a.",
        },
      }));
    }
  };

  if (!user) return (
    <div className="profile-container">
      <div className="profile-card text-center">
        <h3>Debes iniciar sesi\u00f3n para ver tu perfil</h3>
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
        <span className="ptn-title">Profile</span>
        <button className="ptn-logout" onClick={handleLogout}>Cerrar sesi\u00f3n</button>
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
            <span className="ps-icon"><FaHeart /></span>
            <h3>{favorites.length}</h3>
            <span>FAVORITOS</span>
          </div>
          <div className="ps-card">
            <span className="ps-icon"><FaCalendarAlt /></span>
            <h3>{bookings.length}</h3>
            <span>RESERVAS</span>
          </div>
        </div>

        {/* FAVORITOS */}
        <section className="profile-content-section">
          <h3 className="pcs-title">
            <span className="pcs-title-icon"><FaHeart /></span>
            Vuelos favoritos
          </h3>
          {favorites.length === 0 ? (
            <div className="pcs-empty-state">
              <div className="pcs-empty-icon"><FaRegHeart /></div>
              <p>No tienes vuelos favoritos a\u00fan.</p>
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
                        <button className="btn-delete" onClick={() => handleRemoveFavorite(vuelo.id)} aria-label="Quitar favorito"><FaTrashAlt /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RESERVAS */}
        <section className="profile-content-section is-centered">
          <h3 className="pcs-title">
            <span className="pcs-title-icon"><FaPlaneDeparture /></span>
            Mis reservas
          </h3>
          {bookings.length === 0 ? (
            <div className="pcs-empty-state">
              <div className="pcs-empty-icon"><FaTicketAlt /></div>
              <p>No tienes reservas registradas.</p>
            </div>
          ) : (
            <div className="card-grid bookings-grid">
              {bookings.map((b, idx) => {
                const vuelo = b.product || b;
                const fechaValue = b.travelDate ?? b.dateStr ?? b.bookingDate;
                const isFinalized = isBookingFinalized(b);
                const esFuturo = !isFinalized;
                const productId = resolveProductId(vuelo) || resolveProductId(b);
                const reviewForm = reviewForms[productId] || { rating: 0, comment: "" };
                const reviewInfo = reviewsByProduct[productId];
                const reviewState = reviewStatus[productId];
                return (
                  <div key={`book-${b.id}-${idx}`} className="card flight-card booking-card">
                    <div className="flight-card-header">
                      <span className={`badge ${esFuturo ? "badge-next" : "badge-past"}`}>
                        {esFuturo ? "Pr\u00f3ximo vuelo" : "Completado"}
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
                      <p className="flight-meta-data"><FaCalendarAlt className="flight-meta-icon" /> {formatBookingDate(fechaValue)}</p>
                      <div className="flight-footer mt-2">
                        <span className="flight-price">${vuelo.price}</span>
                        <button className="btn-delete" onClick={() => handleCancelBooking(b.id)} aria-label="Cancelar reserva"><FaTrashAlt /></button>
                      </div>
                      {productId && (
                        <Link
                          to={`/vuelo/${productId}`}
                          state={{ vuelo: { ...vuelo, productId } }}
                          className="flight-detail-link"
                        >
                          Ver detalle del vuelo
                        </Link>
                      )}
                      {isFinalized ? (
                        <div className="booking-review">
                          <div className="booking-review-head">
                            <span>Tu valoraci\u00f3n</span>
                            {reviewInfo && (
                              <span className="booking-review-date">
                                Publicada {formatBookingDate(reviewInfo.createdAt)}
                              </span>
                            )}
                          </div>
                          {reviewsLoading && (
                            <span className="booking-review-loading">Cargando rese\u00f1as...</span>
                          )}
                          {!productId ? (
                            <p className="booking-review-disabled">Este vuelo no admite valoraciones.</p>
                          ) : (
                            <>
                              <div className="booking-review-stars" role="radiogroup" aria-label="Puntuaci\u00f3n">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const filled = star <= (reviewForm.rating || 0);
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      className={`booking-star-btn ${filled ? "is-filled" : ""}`}
                                      onClick={() => updateReviewForm(productId, { rating: star })}
                                      aria-pressed={reviewForm.rating === star}
                                      aria-label={`${star} estrellas`}
                                    >
                                      {filled ? <FaStar /> : <FaRegStar />}
                                    </button>
                                  );
                                })}
                              </div>
                              <textarea
                                className="booking-review-text"
                                rows={3}
                                value={reviewForm.comment || ""}
                                onChange={(e) => updateReviewForm(productId, { comment: e.target.value })}
                                placeholder="Cont\u00e1 tu experiencia (opcional)"
                              />
                              <button
                                type="button"
                                className="booking-review-submit"
                                onClick={() => handleSubmitReview(productId)}
                                disabled={reviewState?.type === "loading"}
                              >
                                {reviewState?.type === "loading"
                                  ? "Guardando..."
                                  : reviewInfo
                                    ? "Actualizar rese\u00f1a"
                                    : "Publicar rese\u00f1a"}
                              </button>
                              {reviewState?.message && (
                                <span className={`booking-review-message ${reviewState.type}`}>
                                  {reviewState.message}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="booking-review-disabled">Podr\u00e1s valorar cuando finalice tu viaje.</p>
                      )}
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
