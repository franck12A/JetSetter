// src/pages/AdminPanel/AdminUsersPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaRegBell, FaSearch, FaUserPlus } from "react-icons/fa";
import AdminUsersList from "../AdminUsersList/AdminUsersList";
import { AuthContext } from "../../context/AuthContext";

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

  // Función para obtener todos los usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("http://localhost:8080/api/auth/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.status === 401 || res.status === 403) {
        console.warn("Auth falló al obtener usuarios:", res.status);
        logout();
        setError("No autorizado. Volvé a iniciar sesión.");
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setUsuarios(data);
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError(err.message || "Error al cargar usuarios");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Cambiar rol de usuario
  const handleEditRole = async (user) => {
    const newRole = user.role === "ROLE_ADMIN" ? "ROLE_USER" : "ROLE_ADMIN";
    try {
      const res = await fetch(
        `http://localhost:8080/api/auth/${user.id}/role?role=${newRole}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      if (!res.ok) throw new Error("No se pudo actualizar el rol");
      await fetchUsers(); // refresca lista
    } catch (err) {
      alert(err.message);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("¿Seguro que quieres eliminar este usuario?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/auth/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("No se pudo eliminar el usuario");

      setUsuarios((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="loading">Cargando usuarios...</p>;
  if (error) return <p className="error">{error}</p>;

  const filteredUsers = usuarios.filter(u => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = fullName.includes(searchLow) || email.includes(searchLow);

    let matchesRole = true;
    if (filterRole === "Admin") matchesRole = u.role === "ROLE_ADMIN";
    if (filterRole === "Editor") matchesRole = u.role === "ROLE_EDITOR";
    if (filterRole === "User") matchesRole = u.role === "ROLE_USER";

    return matchesSearch && matchesRole;
  });

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
          {["Todos", "Admin", "Editor", "User"].map(role => (
            <button
              key={role}
              className={`au-pill ${filterRole === role ? 'active' : ''}`}
              onClick={() => setFilterRole(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <AdminUsersList
        usuarios={filteredUsers}
        onEditRole={handleEditRole}
        onDelete={handleDeleteUser}
      />

      {/* FLOATING ACTION BUTTON PARA AÑADIR USUARIO */}
      <button
        className="au-fab-add"
        onClick={() => alert("Próximamente: Añadir nuevo usuario")}
      >
        <FaUserPlus />
      </button>

    </div>
  );
}

