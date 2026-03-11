// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as Router } from "react-router-dom"; // o BrowserRouter
import App from "./App";
import Footer from "./components/Footer/Footer";
import { AuthProvider } from "./context/AuthContext";

import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/global.css";
import "./app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <div className="app-container">
          <App />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);
