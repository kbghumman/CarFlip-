import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/CarFlip-/",

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "WildSpeed MotorsOS",
        short_name: "MotorsOS",
        description:
          "Vehicle business management system",

        theme_color: "#111827",
        background_color: "#ffffff",

        display: "standalone",
        orientation: "portrait",

        start_url: "/CarFlip-/",
        scope: "/CarFlip-/",

        icons: [
          {
            src: "/CarFlip-/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/CarFlip-/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        globPatterns: [
          "**/*.{js,css,html,ico,png,svg}",
        ],
      },
    }),
  ],

  server: {
    host: "0.0.0.0",
    port: 5176,
    strictPort: true,
  },
});