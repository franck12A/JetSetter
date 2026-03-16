import React, { useState } from "react";
import { Link } from "react-router-dom";
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
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const parseErrorMessage = async (res, fallback) => {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const data = JSON.parse(text);
      return data?.error || data?.message || fallback;
    } catch {
      return text;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      return setError("Completa todos los campos.");
    }

    if (!form.email.includes("@")) {
      return setError("El correo electronico no es valido.");
    }

    if (form.password.length < 6) {
      return setError("La contrasena debe tener al menos 6 caracteres.");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Las contrasenas no coinciden.");
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const msg = await parseErrorMessage(res, "No se pudo registrar.");
        setLoading(false);
        return setError(msg);
      }

      setSuccess("Registro exitoso. Ya puedes iniciar sesion.");
      setForm({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      setError("Error de conexion con el servidor.");
    }

    setLoading(false);
  };

  return (
    <AuthLayout>
      <AuthCard title="JetSetter" subtitle="Crea tu cuenta para empezar a viajar">
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
            placeholder="Perez"
            value={form.lastName}
            onChange={handleChange}
          />

          <InputField
            label="Email"
            name="email"
            type="email"
            placeholder="tuemail@gmail.com"
            value={form.email}
            onChange={handleChange}
          />

          <InputField
            label="Contrasena"
            name="password"
            type="password"
            placeholder="********"
            value={form.password}
            onChange={handleChange}
          />

          <InputField
            label="Confirmar contrasena"
            name="confirmPassword"
            type="password"
            placeholder="********"
            value={form.confirmPassword}
            onChange={handleChange}
          />

          <PrimaryButton loading={loading}>Crear cuenta</PrimaryButton>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-message error">
              {error}
            </motion.p>
          )}

          {success && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-message success">
              {success}
            </motion.p>
          )}
        </form>

        <p className="auth-switch">
          Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
