import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

function dismissColdStart() {
  const el = document.getElementById("cold-start-loader");
  if (el) {
    const bar = document.getElementById("cold-bar");
    if (bar) bar.style.width = "100%";
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 400);
    }, 300);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App onReady={dismissColdStart} />
    </BrowserRouter>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
