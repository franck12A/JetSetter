import React from "react";

export default function AuthLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f7f7f7",
        padding: "2rem"
      }}
    >
      {children}
    </div>
  );
}
