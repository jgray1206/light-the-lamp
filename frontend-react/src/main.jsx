import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import 'bootstrap/dist/css/bootstrap.min.css';
import App from "./App";
import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;
    // iOS often resumes the PWA from the background instead of reloading it,
    // so check for a new service worker whenever the app comes back to the foreground
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") registration.update();
    });
    setInterval(() => registration.update(), 60 * 60 * 1000);
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
