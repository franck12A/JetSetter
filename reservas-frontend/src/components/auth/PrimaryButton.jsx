import React from "react";
import { motion } from "framer-motion";

export default function PrimaryButton({ children, loading }) {
  return (
    <motion.button
      whileHover={{ scale: loading ? 1 : 1.03 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      disabled={loading}
      style={{
        width: "100%",
        padding: "0.9rem",
        fontSize: "1.1rem",
        fontWeight: "600",
        borderRadius: "10px",
        background: loading
          ? "linear-gradient(135deg, #93c5fd, #60a5fa)"
          : "linear-gradient(135deg, #2563eb, #1d4ed8)",
        border: "none",
        color: "white",
        cursor: loading ? "default" : "pointer",
        transition: "0.3s",
        boxShadow: "0 5px 15px rgba(37, 99, 235, 0.25)",
      }}
    >
      {loading ? (
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "3px solid #fff",
            borderTop: "3px solid transparent",
            borderRadius: "50%",
            margin: "0 auto",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : (
        children
      )}
    </motion.button>
  );
}
