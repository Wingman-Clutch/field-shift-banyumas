// AI-assisted: generated with Claude (Anthropic). See README, "Use of AI".
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// BASE_PATH lets the same build run from a sub-path (e.g. GitHub Pages: BASE_PATH=/repo-name/).
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered in src/main.tsx via virtual:pwa-register
      includeManifestIcons: false, // public/ icons are already precached through globPatterns
      manifest: {
        name: 'Field Shift Banyumas (working title)',
        short_name: 'FieldShift',
        description: 'Working title — Team Wingman Clutch, NASA Space Apps Challenge 2026',
        lang: 'en',
        theme_color: '#1f5134',
        background_color: '#fafaf9',
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + all generated data files are precached, so the app opens offline after one visit.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,json,geojson}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // The architecture diagram is a separate ~850 KB page: keep it out of the offline bundle,
        // and never answer its URL with the app shell (index.html).
        globIgnores: ['architecture.html'],
        navigateFallbackDenylist: [/architecture\.html$/],
        // autoUpdate: a new build takes over open tabs right away (the client then reloads the page).
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Only tiles the user has already viewed; small cap to respect the OSM tile usage policy.
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
