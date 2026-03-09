import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthCard from "../../components/auth/AuthCard";
import InputField from "../../components/auth/InputField";
import PrimaryButton from "../../components/auth/PrimaryButton";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/login/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg || "Usuario o contrasena incorrectos");
        setLoading(false);
        return;
      }

      const data = await res.json();
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      console.error("Error login:", err);
      setError("Error de conexion con el servidor");
    }

    setLoading(false);
  };

  return (
    <AuthLayout>
      <AuthCard title="JetSetter" subtitle="Bienvenido de nuevo">
        <form onSubmit={handleSubmit}>
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

          <div className="auth-helper-row">
            <a href="#" className="auth-link" onClick={(e) => e.preventDefault()}>
              Olvidaste tu contrasena?
            </a>
          </div>

          <PrimaryButton loading={loading}>Iniciar sesion</PrimaryButton>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="auth-message error">
              {error}
            </motion.p>
          )}
        </form>

        <div className="auth-divider">o continua con</div>
        <div className="auth-socials">
          <button type="button" className="auth-social-btn">Google</button>
          <button type="button" className="auth-social-btn">Apple</button>
        </div>

        <p className="auth-switch">
          No tienes cuenta? <Link to="/register">Registrate</Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
