import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

const aasaMiddleware = () => ({
  name: "aasa-mime",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === "/.well-known/apple-app-site-association") {
        const filePath = path.resolve(
          __dirname,
          "public/.well-known/apple-app-site-association"
        );
        res.setHeader("Content-Type", "application/json");
        fs.createReadStream(filePath).pipe(res);
        return;
      }
      next();
    });
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
