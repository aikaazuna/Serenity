import React from "react";
import ReactDOM from "react-dom/client";
import { SystemOverlayApp } from "@/components/overlay/SystemOverlayApp";
import "@/index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SystemOverlayApp />
    </React.StrictMode>
  );
}
