import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

import { cloudflare } from "@cloudflare/vite-plugin";

const isDevelopment = process.env.NODE_ENV === "development";

const BUILD_TIMESTAMP = new Date().toISOString();
const BUILD_ID = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function writeBuildInfoPlugin(): Plugin {
  return {
    name: "write-build-info",
    apply: "build",
    closeBundle() {
      const outDirs = ["dist/client", "dist", "public"];
      const payload = JSON.stringify({ buildId: BUILD_ID, buildTimestamp: BUILD_TIMESTAMP }, null, 2);
      for (const dir of outDirs) {
        try {
          if (fs.existsSync(dir)) {
            fs.writeFileSync(path.join(dir, "build-info.json"), payload);
          }
        } catch {
          /* ignore */
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(BUILD_TIMESTAMP),
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), isDevelopment ? componentTagger() : null, cloudflare(), writeBuildInfoPlugin()],
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