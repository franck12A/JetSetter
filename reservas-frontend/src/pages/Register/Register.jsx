import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";
import InputField from "../../components/auth/InputField";
import PrimaryButton from "../../components/auth/PrimaryButton";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterForm(form) {
  const errors = {};

  if (!form.firstName.trim()) errors.firstName = "El nombre es obligatorio.";
  if (!form.lastName.trim()) errors.lastName = "El apellido es obligatorio.";

  if (!form.email.trim()) {
    errors.email = "El email es obligatorio.";
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = "Ingresa un email valido.";
  }

  if (!form.password) {
    errors.password = "La contrasena es obligatoria.";
  } else if (form.password.length < 6) {
    errors.password = "Debe tener al menos 6 caracteres.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Confirma tu contrasena.";
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  return errors;
}

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setError("");
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setResendMessage("");
    setResendError("");

    const validationErrors = validateRegisterForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setError("Revisa los campos marcados antes de continuar.");
      return;
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
        setError(msg);
        return;
      }

      const emailForResend = form.email.trim();
      setRegisteredEmail(emailForResend);
      setSuccess(`Registro exitoso. Te enviamos un correo a ${emailForResend}.`);
      setForm({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
      setErrors({});
    } catch {
      setError("Error de conexion con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || resendLoading) return;
    setResendMessage("");
    setResendError("");
    setResendLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });

      if (!res.ok) {
        const msg = await parseErrorMessage(res, "No se pudo reenviar el email.");
        setResendError(msg);
        return;
      }

      setResendMessage("Listo. Te reenviamos el email de confirmacion.");
    } catch {
      setResendError("Error de conexion con el servidor.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthCard title="JetSetter" subtitle="Crea tu cuenta para empezar a viajar">
        <form onSubmit={handleSubmit} noValidate>
          <InputField
            label="Nombre"
            name="firstName"
            placeholder="Juan"
            value={form.firstName}
            onChange={handleChange}
            error={errors.firstName}
            autoComplete="given-name"
          />

          <InputField
            label="Apellido"
            name="lastName"
            placeholder="Perez"
            value={form.lastName}
            onChange={handleChange}
            error={errors.lastName}
            autoComplete="family-name"
          />

          <InputField
            label="Correo electrónico"
            name="email"
            type="text"
            placeholder="tuemail@gmail.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            inputMode="email"
          />

          <InputField
            label="Contraseña"
            name="password"
            type="password"
            placeholder="********"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
          />

          <InputField
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            placeholder="********"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
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

          {success && registeredEmail && (
            <div className="auth-resend-row">
              <span>No llego el correo?</span>
              <button
                type="button"
                className="auth-link auth-resend-btn"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? "Reenviando..." : "Reenviar"}
              </button>
            </div>
          )}

          {resendMessage && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-message success">
              {resendMessage}
            </motion.p>
          )}

          {resendError && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-message error">
              {resendError}
            </motion.p>
          )}
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
