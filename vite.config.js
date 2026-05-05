import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173, // Port mặc định của React
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:5017",
        changeOrigin: true,
        secure: false,
      },
      "/images": {
        target: "http://localhost:5017",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
