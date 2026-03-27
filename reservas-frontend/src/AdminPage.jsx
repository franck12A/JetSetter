// src/AdminPage.jsx
import React from "react";
import AdminPanel from "./components/AdminPanel";
import Navbar from "./components/Navbar";
import "./AdminPage.css";

export default function AdminPage() {
  const handleHomeClick = () => {
    window.location.href = "/"; // vuelve al Home
  };

  return (
    <>
      <Navbar />
      <div className="admin-page-actions">
        <button className="btn btn-primary" onClick={handleHomeClick}>
          Volver al Home
        </button>
      </div>
      <AdminPanel />
    </>
  );
}

