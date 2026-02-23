import React from "react";
import { motion } from "framer-motion";

export default function AuthCard({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        padding: "2rem 2.5rem",
        borderRadius: "18px",
        boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontSize: "2rem",
          marginBottom: "1.5rem",
          color: "#1e3a8a",
          fontWeight: "700",
        }}
      >
        {title}
      </h2>

      {children}
    </motion.div>
  );
}
