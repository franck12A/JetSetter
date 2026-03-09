// src/pages/AdminPanel/AdminUsersPage.jsx
import React, { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaRegBell, FaSearch, FaUserPlus } from "react-icons/fa";
import AdminUsersList from "../AdminUsersList/AdminUsersList";
import { AuthContext } from "../../context/AuthContext";
import { listUsers, updateUserRole, deleteUser } from "../../services/adminUsersService";

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

  if (loading) return <p className="loading">Cargando usuarios...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin-users-container">
      {/* HEADER TOP */}
      <div className="au-header-top">
        <div className="au-header-left">
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

      <AdminUsersList usuarios={filteredUsers} onEditRole={handleEditRole} onDelete={handleDeleteUser} />

      {/* FLOATING ACTION BUTTON PARA ANADIR USUARIO */}
      <button className="au-fab-add" onClick={() => alert("Proximamente: Anadir nuevo usuario")}>
        <FaUserPlus />
      </button>
    </div>
  );
}
