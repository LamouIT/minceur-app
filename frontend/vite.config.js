import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Mon suivi minceur",
        short_name: "Minceur",
        description: "Menus, courses, poids et habitudes",
        lang: "fr",
        start_url: "/",
        display: "standalone",
        background_color: "#F4F8F2",
        theme_color: "#2F5A2E",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: { navigateFallback: "/index.html", navigateFallbackDenylist: [/^\/api/] }
    })
  ]
});
