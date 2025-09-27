import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["ww9vtl-5173.csb.app"], // 👈 add your host here
  },
});
