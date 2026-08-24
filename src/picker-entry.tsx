import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PickerOverlay } from "./components/picker/PickerOverlay";
import "./index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Élément racine #root introuvable");

document.documentElement.classList.add("dark");

createRoot(container).render(
  <StrictMode>
    <PickerOverlay />
  </StrictMode>,
);
