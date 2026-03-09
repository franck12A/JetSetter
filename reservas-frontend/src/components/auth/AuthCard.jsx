import React from "react";
import { motion } from "framer-motion";
import { FaPlaneDeparture } from "react-icons/fa";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <motion.div
      className="auth-card"
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="auth-brand-badge" aria-hidden="true">
        <FaPlaneDeparture />
      </div>

      <h2 className="auth-title">{title}</h2>
      {subtitle && <p className="auth-subtitle">{subtitle}</p>}

      {children}
    </motion.div>
  );
}
