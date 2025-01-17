import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from "vite-plugin-pwa";

const manifestForPlugIn = {
  registerType:'autoUpdate',
  includeAssests:['favicon.ico', "apple-touch-icon-180x180.png"],
  manifest:{
    name:"Light the Lamp",
    short_name:"Light the Lamp",
    description:"A simple per-game hockey player drafting game.",
    icons:[
      {
        "src": "pwa-64x64.png",
        "sizes": "64x64",
        "type": "image/png"
      },
      {
        "src": "pwa-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "pwa-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      },
      {
        "src": "maskable-icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    theme_color:'#212529',
    background_color:'#f5f5f5',
    display:"standalone",
    scope:'/',
    start_url:"/",
    orientation:'portrait'
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA(manifestForPlugIn)],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        rewrite: path => path.replace(/^\/api/, ''),
        xfwd: true
      }
    },
  }
})
