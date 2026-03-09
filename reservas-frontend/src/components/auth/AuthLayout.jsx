import React from "react";
import "./AuthTheme.css";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-scene">
      <div className="auth-window-frame" aria-hidden="true">
        <div className="auth-window-view" />
      </div>
      <div className="auth-content">{children}</div>
    </div>
  );
}
