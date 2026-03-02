import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // Silently updates the app when you push new code
      includeAssets: ["vite.svg"], // Assets to cache
      manifest: {
        name: "EduSync Premium",
        short_name: "EduSync",
        description: "The Next-Generation School Management Platform",
        theme_color: "#2563EB", // The blue color of your top mobile status bar
        background_color: "#ffffff",
        display: "standalone", // This is the magic word that hides the browser URL bar!
        icons: [
          {
            src: "/vite.svg", // In production, replace with a real 192x192 PNG logo
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/vite.svg", // In production, replace with a real 512x512 PNG logo
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});
