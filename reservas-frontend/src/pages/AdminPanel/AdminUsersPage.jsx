// src/pages/AdminPanel/AdminUsersPage.jsx
import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaRegBell, FaSearch, FaUserPlus, FaTimes } from "react-icons/fa";
import AdminUsersList from "../AdminUsersList/AdminUsersList";
import { AuthContext } from "../../context/AuthContext";
import { listUsers, updateUserRole, deleteUser } from "../../services/adminUsersService";
import "./AdminUsersPage.css";

export default function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");

  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user")) || { username: "JS" };
  const initials = currentUser.username ? currentUser.username.slice(0, 2).toUpperCase() : "JS";

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
        setError("No autorizado. Volve a iniciar sesion.");
      } else {
        setError(err.message || "Error al cargar usuarios");
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditRole = async (user) => {
    const newRole = user.role === "ROLE_ADMIN" ? "ROLE_USER" : "ROLE_ADMIN";

    try {
      await updateUserRole({ userId: user.id, role: newRole, token });
      await fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Seguro que quieres eliminar este usuario?")) return;

    try {
      await deleteUser({ userId, token });
      setUsuarios((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = useMemo(
    () =>
      usuarios.filter((u) => {
        const fullName = `${u.firstName || ""} ${u.lastName || ""} ${u.username || ""}`.toLowerCase();
        const email = (u.email || "").toLowerCase();
        const searchLow = searchTerm.trim().toLowerCase();
        const matchesSearch = fullName.includes(searchLow) || email.includes(searchLow);

        let matchesRole = true;
        if (filterRole === "Admin") matchesRole = u.role === "ROLE_ADMIN";
        if (filterRole === "Editor") matchesRole = u.role === "ROLE_EDITOR";
        if (filterRole === "User") matchesRole = u.role === "ROLE_USER";

        return matchesSearch && matchesRole;
      }),
    [usuarios, searchTerm, filterRole]
  );

  const summary = useMemo(() => {
    const admin = usuarios.filter((u) => u.role === "ROLE_ADMIN").length;
    const editor = usuarios.filter((u) => u.role === "ROLE_EDITOR").length;
    const user = usuarios.filter((u) => u.role === "ROLE_USER").length;
    return { total: usuarios.length, admin, editor, user };
  }, [usuarios]);

  if (loading) return <p className="loading">Cargando usuarios...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin-users-container">
      {/* HEADER TOP */}
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

      {/* SEARCH Y FILTROS */}
      <div className="admin-filters-top">
        <div className="au-search-bar">
          <FaSearch className="au-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="au-clear-search" onClick={() => setSearchTerm("")} type="button" aria-label="Limpiar busqueda">
              <FaTimes />
            </button>
          )}
        </div>

        <div className="au-filter-pills">
          {["Todos", "Admin", "Editor", "User"].map((role) => (
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

      <div className="au-summary-grid">
        <div className="au-summary-card">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="au-summary-card">
          <span>Admins</span>
          <strong>{summary.admin}</strong>
        </div>
        <div className="au-summary-card">
          <span>Editors</span>
          <strong>{summary.editor}</strong>
        </div>
        <div className="au-summary-card">
          <span>Users</span>
          <strong>{summary.user}</strong>
        </div>
      </div>

      <div className="au-results-head">
        <p>
          Mostrando <strong>{filteredUsers.length}</strong> de <strong>{usuarios.length}</strong> usuarios
        </p>
      </div>

      <AdminUsersList usuarios={filteredUsers} onEditRole={handleEditRole} onDelete={handleDeleteUser} />

      {/* FLOATING ACTION BUTTON PARA ANADIR USUARIO */}
      <button className="au-fab-add" onClick={() => alert("Proximamente: Anadir nuevo usuario")}>
        <FaUserPlus />
      </button>
    </div>
  );
}
