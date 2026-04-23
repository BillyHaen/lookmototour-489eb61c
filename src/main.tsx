import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Build marker: force fresh deployment artifact (2026-04-23)
createRoot(document.getElementById("root")!).render(<App />);
