import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({plugins:[react(),VitePWA({registerType:'autoUpdate',includeAssets:['icon-192x192.png','icon-512x512.png'],manifest:{name:'Primy — Registro Lotterie',short_name:'Primy',description:'Generatore e registro personale di combinazioni per EuroDreams e La Primitiva',start_url:'/',scope:'/',display:'standalone',lang:'it',orientation:'portrait',theme_color:'#0f172a',background_color:'#f8fafc',icons:[{src:'/icon-192x192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},{src:'/icon-512x512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]}})]});
