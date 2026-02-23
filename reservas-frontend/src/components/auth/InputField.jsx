import React from "react";

export default function InputField({
  label,
  name,       // ← NECESARIO
  type,
  value,
  onChange,
  error,
  placeholder
}) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <label
        htmlFor={name}
        style={{
          fontSize: "0.9rem",
          fontWeight: "500",
          display: "block",
          marginBottom: "0.3rem",
          color: "#374151",
        }}
      >
        {label}
      </label>

      <input
        id={name}
        name={name}   // ← CLAVE
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "0.8rem 1rem",
          borderRadius: "10px",
          border: error ? "2px solid #dc2626" : "2px solid #d1d5db",
          fontSize: "1rem",
          background: "#f9fafb",
          transition: "0.25s",
        }}
      />

      {error && (
        <p style={{ color: "#dc2626", marginTop: "0.3rem", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}
