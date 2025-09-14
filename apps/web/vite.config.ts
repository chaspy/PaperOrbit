import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5175",
        changeOrigin: true,
      },
    },
  },
});

