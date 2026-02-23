import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
        setError(msg || "Usuario o contraseña incorrectos");
        setLoading(false);
        return;
      }

      const data = await res.json();
      login(data.user, data.token); // actualiza context y localStorage
      navigate("/"); // redirige al home
    } catch (err) {
      console.error("Error login:", err);
      setError("Error de conexión con el servidor");
    }

    setLoading(false);
  };

  return (
    <AuthLayout>
      <AuthCard title="Iniciar sesión">
        <form onSubmit={handleSubmit}>
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

          <PrimaryButton loading={loading}>Iniciar sesión</PrimaryButton>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: "1rem", color: "#dc2626", textAlign: "center" }}
            >
              {error}
            </motion.p>
          )}
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
