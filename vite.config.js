import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['icon-192x192.png', 'icon-512x512.png', 'apple-touch-icon.png', 'favicon.svg', 'primy-mark.svg', 'primy-logo.svg', 'offline.html', 'mascot/*.webp'],
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/bootstrap'),
            handler: 'NetworkFirst',
            options: { cacheName: 'primy-bootstrap-v16-1-0', networkTimeoutSeconds: 6, expiration: { maxEntries: 8, maxAgeSeconds: 1800 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/history'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'primy-history-v16-1-0', expiration: { maxEntries: 12, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/check-results'),
            handler: 'NetworkFirst',
            options: { cacheName: 'primy-results-v16-1-0', networkTimeoutSeconds: 4, expiration: { maxEntries: 24, maxAgeSeconds: 300 } },
          },
        ],
      },
      manifest: {
        name: 'Primy — Tus jugadas, a tu manera',
        short_name: 'Primy',
        description: 'Crea, guarda y comprueba tus jugadas desde una experiencia clara, privada y responsable.',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        lang: 'es-ES',
        orientation: 'any',
        theme_color: '#0B7A49',
        background_color: '#FBF8EF',
        categories: ['utilities', 'entertainment'],
        shortcuts: [
          { name: 'Preparar jugada', short_name: 'Preparar', url: '/crear', icons: [{ src: '/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Ver juegos', short_name: 'Juegos', url: '/juegos', icons: [{ src: '/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Abrir archivo', short_name: 'Archivo', url: '/archivo', icons: [{ src: '/icon-192x192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});
