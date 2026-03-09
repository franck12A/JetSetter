import React from "react";

export default function InputField({
  label,
  name,
  type,
  value,
  onChange,
  error,
  placeholder,
}) {
  return (
    <div className="auth-input-wrapper">
      <label htmlFor={name} className="auth-label">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className={`auth-input ${error ? "is-error" : ""}`}
      />

      {error && <p className="auth-inline-error">{error}</p>}
    </div>
  );
}
