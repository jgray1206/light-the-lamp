if(!self.define){let e,i={};const n=(n,s)=>(n=new URL(n+".js",s).href,i[n]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=i,document.head.appendChild(e)}else e=n,importScripts(n),i()})).then((()=>{let e=i[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(s,r)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(i[c])return;let o={};const d=e=>n(e,c),t={module:{uri:c},exports:o,require:d};i[c]=Promise.all(s.map((e=>t[e]||d(e)))).then((e=>(r(...e),o)))}}define(["./workbox-5ffe50d4"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-BrRONkNi.js",revision:null},{url:"assets/index-BwRTELk-.css",revision:null},{url:"firebase-messaging-sw.js",revision:"5890d71b0aabca31a999e68d1c63f24d"},{url:"index.html",revision:"6bb7f120cd0e541583b665b2484a5b1d"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"apple-touch-icon-180x180.png",revision:"8eb7200cfd34889130d8ece66b190b01"},{url:"favicon.ico",revision:"d78cebea22578da73cdea82dcc727048"},{url:"maskable-icon-512x512.png",revision:"a3d514fd6ca91f7367cf5b6e9e502b6e"},{url:"pwa-192x192.png",revision:"74d771373026387f64acee1b29512c4a"},{url:"pwa-512x512.png",revision:"e39408923a9e949c0b0bf366c279b2c4"},{url:"pwa-64x64.png",revision:"67393870bd4df1e473a5b780b9659eec"},{url:"manifest.webmanifest",revision:"c69e96c38f3ed17b621f2e6a288cf1e8"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
