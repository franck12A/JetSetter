import React, { useState } from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";
import InputField from "../../components/auth/InputField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import { motion } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      return setError("Completa todos los campos.");
    }

    if (!form.email.includes("@")) {
      return setError("El correo electrónico no es válido.");
    }

    if (form.password.length < 6) {
      return setError("La contraseña debe tener al menos 6 caracteres.");
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const msg = await res.text();
        setLoading(false);
        return setError(msg || "No se pudo registrar.");
      }

      setSuccess("Registro exitoso. Revisá tu correo ☑️");
    } catch (err) {
      setError("Error de conexión con el servidor.");
    }

    setLoading(false);
  };

  return (
    <AuthLayout>
      <AuthCard title="Crear cuenta">
        <form onSubmit={handleSubmit}>
          <InputField
            label="Nombre"
            name="firstName"
            type="text"
            placeholder="Juan"
            value={form.firstName}
            onChange={handleChange}
          />

          <InputField
            label="Apellido"
            name="lastName"
            type="text"
            placeholder="Pérez"
            value={form.lastName}
            onChange={handleChange}
          />

          <InputField
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="tuemail@gmail.com"
            value={form.email}
            onChange={handleChange}
          />

          <InputField
            label="Contraseña"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
          />

          <PrimaryButton loading={loading}>Registrarme</PrimaryButton>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: "1rem", color: "#dc2626", textAlign: "center" }}
            >
              {error}
            </motion.p>
          )}

          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: "1rem", color: "#16a34a", textAlign: "center" }}
            >
              {success}
            </motion.p>
          )}
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center" }}>
          ¿Ya tenés cuenta?
          <a href="/login" style={{ color: "#2563eb", marginLeft: "5px" }}>
            Iniciar sesión
          </a>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
