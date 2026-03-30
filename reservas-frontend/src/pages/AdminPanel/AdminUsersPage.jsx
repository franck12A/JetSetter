import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaRegBell, FaSearch, FaTimes } from "react-icons/fa";
import AdminUsersList from "../AdminUsersList/AdminUsersList";
import { AuthContext } from "../../context/AuthContext";
import { deleteUser, listUsers, updateUserRole } from "../../services/adminUsersService";
import "./AdminUsersPage.css";

export default function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [savingRoleId, setSavingRoleId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const { token, logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const initials = currentUser?.firstName
    ? `${currentUser.firstName[0] || ""}${currentUser.lastName?.[0] || ""}`.toUpperCase()
    : (currentUser?.username || currentUser?.email || "JS").slice(0, 2).toUpperCase();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listUsers(token);
      setUsuarios(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      if (err.message === "UNAUTHORIZED") {
        logout();
        setError("No autorizado. Vuelve a iniciar sesion.");
      } else {
        setError(err.message || "Error al cargar usuarios");
      }
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSaveRole = async (targetUser, nextRole) => {
    setFeedback(null);
    setSavingRoleId(targetUser.id);
    try {
      const updatedUser = await updateUserRole({ userId: targetUser.id, role: nextRole, token });
      setUsuarios((prev) => prev.map((userItem) => (userItem.id === targetUser.id ? updatedUser : userItem)));
      setFeedback({ type: "success", message: `Rol actualizado para ${updatedUser.fullName}.` });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "No se pudo actualizar el rol." });
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Seguro que quieres eliminar este usuario?")) return;
    setFeedback(null);
    setDeletingUserId(userId);
    try {
      await deleteUser({ userId, token });
      setUsuarios((prev) => prev.filter((userItem) => userItem.id !== userId));
      setFeedback({ type: "success", message: "Usuario eliminado correctamente." });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "No se pudo eliminar el usuario." });
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => usuarios.filter((userItem) => {
    const searchLow = searchTerm.trim().toLowerCase();
    const fullName = `${userItem.firstName || ""} ${userItem.lastName || ""} ${userItem.username || ""}`.toLowerCase();
    const email = (userItem.email || "").toLowerCase();
    const matchesSearch = !searchLow || fullName.includes(searchLow) || email.includes(searchLow);

    let matchesRole = true;
    if (filterRole === "Administrador") matchesRole = userItem.role === "ROLE_ADMIN";
    if (filterRole === "Usuario") matchesRole = userItem.role === "ROLE_USER";

    return matchesSearch && matchesRole;
  }), [filterRole, searchTerm, usuarios]);

  const summary = useMemo(() => ({
    total: usuarios.length,
    admin: usuarios.filter((userItem) => userItem.role === "ROLE_ADMIN").length,
    user: usuarios.filter((userItem) => userItem.role === "ROLE_USER").length,
  }), [usuarios]);

  if (loading) return <p className="loading">Cargando usuarios...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin-users-container">
      <div className="au-header-top">
        <div className="au-header-left">
          <Link to="/" className="au-home-logo-link" aria-label="Ir al inicio">
            <img src="/assets/logoJettSeter.png" alt="JetSetter" className="au-home-logo" />
          </Link>
          <button className="au-back-btn" onClick={() => navigate(-1)}>
            <FaChevronLeft />
          </button>
          <h1 className="title">Admin Usuarios</h1>
        </div>
        <div className="au-header-right">
          <FaRegBell className="au-bell-icon" />
          <div className="au-user-avatar">{initials}</div>
        </div>
      </div>

      <div className="admin-filters-top">
        <div className="au-search-bar">
          <FaSearch className="au-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button className="au-clear-search" onClick={() => setSearchTerm("")} type="button" aria-label="Limpiar busqueda">
              <FaTimes />
            </button>
          )}
        </div>

        <div className="au-filter-pills">
          {["Todos", "Administrador", "Usuario"].map((role) => (
            <button
              key={role}
              className={`au-pill ${filterRole === role ? "active" : ""}`}
              onClick={() => setFilterRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`au-feedback ${feedback.type === "success" ? "is-success" : "is-error"}`} role="status">
          {feedback.message}
        </div>
      )}

      <div className="au-summary-grid">
        <div className="au-summary-card">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="au-summary-card">
          <span>Administradores</span>
          <strong>{summary.admin}</strong>
        </div>
        <div className="au-summary-card">
          <span>Usuarios</span>
          <strong>{summary.user}</strong>
        </div>
      </div>

      <div className="au-results-head">
        <p>Mostrando <strong>{filteredUsers.length}</strong> de <strong>{usuarios.length}</strong> usuarios</p>
      </div>

      <AdminUsersList
        usuarios={filteredUsers}
        onSaveRole={handleSaveRole}
        onDelete={handleDeleteUser}
        savingRoleId={savingRoleId}
        deletingUserId={deletingUserId}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
