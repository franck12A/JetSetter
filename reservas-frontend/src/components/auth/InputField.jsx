import React from "react";

export default function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  inputMode,
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
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`auth-input ${error ? "is-error" : ""}`}
      />

      {error && <p id={`${name}-error`} className="auth-inline-error">{error}</p>}
    </div>
  );
}
