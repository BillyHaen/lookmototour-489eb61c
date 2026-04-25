import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

import { cloudflare } from "@cloudflare/vite-plugin";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Build-time guard: fail the build if index.html doesn't contain the markers
 * that prove this is the real LookMotoTour app bundle (and not a placeholder
 * shell). Runs only on `vite build`.
 */
function appBundleGuard(): Plugin {
  const REQUIRED_MARKERS: Array<{ name: string; test: (html: string) => boolean }> = [
    { name: "<div id=\"root\">", test: (h) => /<div\s+id=["']root["']/.test(h) },
    { name: "/src/main.tsx entry", test: (h) => h.includes("/src/main.tsx") || h.includes("main.tsx") },
    { name: "LookMotoTour title", test: (h) => /LookMotoTour/i.test(h) },
    { name: "manifest.json link", test: (h) => h.includes("manifest.json") },
  ];
  const FORBIDDEN = ["lovable-placeholder", "Vite + React placeholder"];

  return {
    name: "app-bundle-guard",
    apply: "build",
    buildStart() {
      const indexPath = path.resolve(__dirname, "index.html");
      if (!fs.existsSync(indexPath)) {
        this.error("[app-bundle-guard] index.html is missing — refusing to build.");
        return;
      }
      const html = fs.readFileSync(indexPath, "utf8");

      const missing = REQUIRED_MARKERS.filter((m) => !m.test(html)).map((m) => m.name);
      const forbidden = FORBIDDEN.filter((s) => html.includes(s));

      if (missing.length || forbidden.length) {
        const lines = [
          "[app-bundle-guard] index.html does not look like the LookMotoTour app bundle.",
          missing.length ? `  Missing markers: ${missing.join(", ")}` : "",
          forbidden.length ? `  Found placeholder content: ${forbidden.join(", ")}` : "",
          "  Refusing to build to prevent publishing a placeholder.",
        ].filter(Boolean);
        this.error(lines.join("\n"));
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), isDevelopment ? componentTagger() : null, appBundleGuard(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
});
