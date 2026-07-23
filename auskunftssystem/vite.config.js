import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'BOS-Kurzwahlen',
        short_name: 'BOS-KW',
        description: 'BOS-Kurzwahlen – Funkgruppen schnell nachschlagen',
        lang: 'de',
        dir: 'ltr',
        theme_color: '#50e3c2',
        background_color: '#50e3c2',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          { src: 'icons/android/android-launchericon-48-48.png',   sizes: '48x48',   type: 'image/png' },
          { src: 'icons/android/android-launchericon-72-72.png',   sizes: '72x72',   type: 'image/png' },
          { src: 'icons/android/android-launchericon-96-96.png',   sizes: '96x96',   type: 'image/png' },
          { src: 'icons/android/android-launchericon-144-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/android/android-launchericon-192-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/android/android-launchericon-512-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/ios/57.png',   sizes: '57x57',   type: 'image/png' },
          { src: 'icons/ios/60.png',   sizes: '60x60',   type: 'image/png' },
          { src: 'icons/ios/72.png',   sizes: '72x72',   type: 'image/png' },
          { src: 'icons/ios/76.png',   sizes: '76x76',   type: 'image/png' },
          { src: 'icons/ios/114.png',  sizes: '114x114', type: 'image/png' },
          { src: 'icons/ios/120.png',  sizes: '120x120', type: 'image/png' },
          { src: 'icons/ios/144.png',  sizes: '144x144', type: 'image/png' },
          { src: 'icons/ios/152.png',  sizes: '152x152', type: 'image/png' },
          { src: 'icons/ios/167.png',  sizes: '167x167', type: 'image/png' },
          { src: 'icons/ios/180.png',  sizes: '180x180', type: 'image/png' },
          { src: 'icons/ios/192.png',  sizes: '192x192', type: 'image/png' },
          { src: 'icons/ios/512.png',  sizes: '512x512', type: 'image/png' },
          { src: 'icons/ios/1024.png', sizes: '1024x1024', type: 'image/png' },
        ],
        shortcuts: [
          {
            name: 'Suche',
            short_name: 'Suche',
            description: 'Direkt zur Suche',
            url: '/',
            icons: [{ src: 'icons/android/android-launchericon-192-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/contacts\.json$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'contacts-data' },
          },
          {
            urlPattern: /\/version\.json$/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
