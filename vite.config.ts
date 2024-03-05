import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

installGlobals();

export default defineConfig({
  optimizeDeps: {
    include: ["workbox-window", "workbox-precaching", "workbox-core", "workbox-routing"]
  },
  plugins: [
    remix({
      ssr: false,
    }),
    tsconfigPaths(),
    VitePWA({
      mode: 'development',
      strategies: 'injectManifest',
      srcDir: 'app',
      filename: 'claims-sw.ts',
      base: '/',
      injectRegister: false,
      registerType: 'autoUpdate',
      manifest: {
        name: "Remix PWA",
        short_name: "Remix PWA",
        theme_color: "#ffffff",
        start_url: "/",
        display: "standalone",
        edge_side_panel: {
          preferred_width: 480,
        }
      },
      injectManifest: {
        globDirectory: 'build/client',
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        dontCacheBustURLsMatching: /assets\//,
        // for testing purposes only
        minify: false,
        enableWorkboxModulesLogs: true,
      },
      pwaAssets: {
        config: true,
      },
      integration: {
        closeBundleOrder: 'post',
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/',
      }
    })
  ],
});
