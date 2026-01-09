import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Important for Docker to expose the server
    port: 5173, // Standard vite port
    strictPort: true, // Exit if the port is already in use
    hmr: false, //Random shit with hmr maybe fix in future
    watch: {
      usePolling: true, 
      interval: 1000
    },
    cors: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
});
