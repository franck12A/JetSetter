import React from "react";
import "./FloatingInput.css";

export default function FloatingInput({ label, ...props }) {
  return (
    <div className="floating-group">
      <input {...props} required />
      <label>{label}</label>
    </div>
  );
}
