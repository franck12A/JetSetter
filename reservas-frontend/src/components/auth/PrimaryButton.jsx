import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";

export default function PrimaryButton({ children, loading, type = "submit" }) {
  return (
    <motion.button
      type={type}
      className="auth-primary-btn"
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      disabled={loading}
    >
      {loading ? <span className="auth-spinner" aria-hidden="true" /> : <><span>{children}</span><FaArrowRight /></>}
    </motion.button>
  );
}
