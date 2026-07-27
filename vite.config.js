import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['icon-192x192.png', 'icon-512x512.png', 'offline.html'],
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/bootstrap'),
            handler: 'NetworkFirst',
            options: { cacheName: 'primy-bootstrap-v12', networkTimeoutSeconds: 6, expiration: { maxEntries: 8, maxAgeSeconds: 1800 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/history'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'primy-history-v12', expiration: { maxEntries: 12, maxAgeSeconds: 21600 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/check-results'),
            handler: 'NetworkFirst',
            options: { cacheName: 'primy-results-v12', networkTimeoutSeconds: 4, expiration: { maxEntries: 24, maxAgeSeconds: 300 } },
          },
        ],
      },
      manifest: {
        name: 'Primy — Assistente privato di gioco',
        short_name: 'Primy',
        description: 'Crea giocate coordinate, registra schedine e controlla i risultati con privacy e trasparenza.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        lang: 'it',
        orientation: 'any',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        categories: ['utilities'],
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});
