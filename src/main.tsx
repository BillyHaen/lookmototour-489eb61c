import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installPlaceholderGuard } from "./lib/placeholderGuard";

createRoot(document.getElementById("root")!).render(<App />);

installPlaceholderGuard();
