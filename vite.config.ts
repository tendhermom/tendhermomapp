import { defineConfig, Plugin, ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import type { IncomingMessage, ServerResponse } from "http";

const wellKnownMiddleware = (): Plugin => ({
  name: "well-known-mime",
  configureServer(server: ViteDevServer) {
    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const wellKnownFiles: Record<string, string> = {
          "/.well-known/apple-app-site-association": "public/.well-known/apple-app-site-association",
          "/.well-known/assetlinks.json": "public/.well-known/assetlinks.json",
        };

        const relativePath = wellKnownFiles[req.url || ""];
        if (relativePath) {
          const filePath = path.resolve(__dirname, relativePath);
          res.setHeader("Content-Type", "application/json");
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      }
    );
  },
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    aasaMiddleware(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
