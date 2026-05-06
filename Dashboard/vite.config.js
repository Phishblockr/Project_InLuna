import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext", //browsers can handle the latest ES features
  },
  server: {
    host: true, // Listen on all addresses (0.0.0.0)
    allowedHosts: [".lvh.me"], // Allow any subdomain of lvh.me
  },
});
