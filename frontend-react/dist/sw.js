if(!self.define){let e,i={};const n=(n,s)=>(n=new URL(n+".js",s).href,i[n]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=i,document.head.appendChild(e)}else e=n,importScripts(n),i()})).then((()=>{let e=i[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(s,r)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(i[o])return;let t={};const c=e=>n(e,o),l={module:{uri:o},exports:t,require:c};i[o]=Promise.all(s.map((e=>l[e]||c(e)))).then((e=>(r(...e),t)))}}define(["./workbox-5ffe50d4"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-CJwQ1zKR.js",revision:null},{url:"assets/index-DAwcouPO.css",revision:null},{url:"index.html",revision:"d4f106c15d18b252d77221128c630560"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"maskable-icon-512x512.png",revision:"b3e0f438406225ff6453e21e659cf815"},{url:"pwa-192x192.png",revision:"74d771373026387f64acee1b29512c4a"},{url:"pwa-512x512.png",revision:"e39408923a9e949c0b0bf366c279b2c4"},{url:"pwa-64x64.png",revision:"67393870bd4df1e473a5b780b9659eec"},{url:"manifest.webmanifest",revision:"c69e96c38f3ed17b621f2e6a288cf1e8"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
