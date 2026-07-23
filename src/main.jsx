import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./personnalisation.js";
import "./transports-dynamiques.js";
import "./lieux-reels.js";
import "./assistant-vocal.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
