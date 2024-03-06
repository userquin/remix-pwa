import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import {VitePluginPWAAPI, VitePWA} from "vite-plugin-pwa";
import Inspect from 'vite-plugin-inspect'
import {ResolvedVitePluginConfig} from "@remix-run/dev/dist/vite/plugin";
import { resolve as resolvePath } from 'node:path'
import { createReadStream } from 'node:fs'
import { lstat } from 'node:fs/promises'
import { createHash } from 'node:crypto'

installGlobals();

export default defineConfig(() => {
  let api: VitePluginPWAAPI | undefined;
  let buildData: Pick<ResolvedVitePluginConfig, "appDirectory" | "routes" | "ssr"> | undefined;
  return {
    optimizeDeps: {
      include: ["workbox-window", "workbox-precaching", "workbox-core", "workbox-routing"]
    },
    plugins: [
      remix({
        ssr: process.env.SPA === 'true',
        async buildEnd({ remixConfig: { appDirectory, routes, ssr  }}) {
          // buildData will be used in integration.beforeBuildServiceWorker
          buildData = { appDirectory, routes, ssr };
          // whn calling generateSW
          await api?.generateSW()
        }
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
          async beforeBuildServiceWorker(options) {
            if (buildData) {
              // if SSR: we need to include the navigateFallback entry in the sw precache manifest
              if (buildData.ssr && options.strategies === 'injectManifest' && options.injectManifest.injectionPoint) {
                // assume the fallback is the root page, remix integration will allow to configure it
                // we're going to add the / route with the corresponding tsx file hash
                const entryPoint = Object.entries(buildData.routes).find(([name]) => name === 'routes/_index');
                if (entryPoint) {
                  const path = resolvePath(buildData.appDirectory, entryPoint![1].file)
                  options.injectManifest.manifestTransforms ??= [];
                  options.injectManifest.manifestTransforms.push(async (entries) => {
                    const revision = await new Promise<string>((resolve, reject) => {
                      const cHash = createHash('MD5')
                      const stream = createReadStream(path, 'utf-8')
                      stream.on('error', (err) => {
                        reject(err)
                      })
                      stream.on('data', chunk => cHash.update(chunk))
                      stream.on('end', () => {
                        resolve(cHash.digest('hex'))
                      })
                    })
                    const size = await lstat(path).then(s => s.size)
                    entries.push({url: '/', revision, size })
                    return { manifest: entries, warnings: [] }
                  });
                }
              }
            }
          }
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: '/',
        }
      }),
      {
        name: 'remix-pwa:build',
        apply: 'build',
        configResolved(config) {
          if (!config.build.ssr)
            api = config.plugins.find(p => p.name === 'vite-plugin-pwa')?.api;
        },
      },
      Inspect({
        build: false,
      }),
    ],
  }
});
