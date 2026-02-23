// src/pages/AdminUsersPage/AdminUsersPage.jsx
import React, { useEffect, useState, useContext } from "react";
import AdminUsersList from "../AdminUsersList/AdminUsersList";
import { AuthContext } from "../../context/AuthContext";

export default function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, logout } = useContext(AuthContext);

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

  return (
    <div>
      <h1 className="title">Administrar Usuarios</h1>
      <AdminUsersList
        usuarios={usuarios}
        onEditRole={handleEditRole}
        onDelete={handleDeleteUser}
      />
    </div>
  );
}

