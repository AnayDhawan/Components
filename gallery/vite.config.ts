import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Served from https://<user>.github.io/Components/, so assets need the repo
  // name as a base. Overridable for local preview and for a custom domain.
  base: process.env.GALLERY_BASE ?? "/Components/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
