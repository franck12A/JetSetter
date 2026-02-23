// src/AdminPage.jsx
import React from "react";
import AdminPanel from "./components/AdminPanel";
import Navbar from "./components/Navbar";

export default function AdminPage() {
  const handleHomeClick = () => {
    window.location.href = "/"; // vuelve al Home
  };

  return (
    <>
      <Navbar />
      <div className="text-center my-4">
        <button className="btn btn-primary" onClick={handleHomeClick}>
          Volver al Home
        </button>
      </div>
      <AdminPanel />
    </>
  );
}

