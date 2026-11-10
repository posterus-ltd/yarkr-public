# Vite config, head tags and service worker registration

## `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt", // never reload under the user; see src/pwa/register-sw.ts
      injectRegister: false, // we register ourselves to hook updates into the toast
      pwaAssets: { config: true }, // reads pwa-assets.config.ts, injects icon links
      manifest: {
        id: "/",
        name: "Acme Planner",
        short_name: "Planner",
        description: "Plan your week with your team.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        // icons are added by pwaAssets; list them by hand if you generate with the CLI instead:
        // { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        // { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        // { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        screenshots: [
          { src: "screenshots/wide.png", sizes: "1280x720", type: "image/png", form_factor: "wide" },
          { src: "screenshots/narrow.png", sizes: "720x1280", type: "image/png", form_factor: "narrow" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,webmanifest}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/version\.json$/, /\.txt$/],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false }, // flip to true to debug the worker in `vite dev`
    }),
  ],
});
```

`tsconfig.json` → `"types": ["vite-plugin-pwa/client"]` so `virtual:pwa-register` type-checks.

## `pwa-assets.config.ts`

```ts
import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset: minimal2023Preset,
  images: ["public/logo.svg"],
});
```

## `index.html` head

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
<meta name="apple-mobile-web-app-title" content="Planner" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<!-- Only needed when generating icons with the CLI instead of pwaAssets: -->
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
```

## `src/pwa/register-sw.ts`

```ts
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";
import i18n from "@/i18n";

/** Registers the service worker and asks before activating a new one. Call once, after <Toaster /> mounts. */
export const registerServiceWorker = (): void => {
  if (!("serviceWorker" in navigator)) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      toast.info(i18n.t("common:newVersion.title"), {
        id: "new-version", // same id as spa-new-version-prompt, so the two never stack
        description: i18n.t("common:newVersion.description"),
        duration: Infinity,
        action: { label: i18n.t("common:newVersion.reload"), onClick: () => void updateSW(true) },
      });
    },
    onRegisterError(error) {
      console.debug("service worker registration failed", error);
    },
  });
};
```

When the app also polls `version.json` (spa-new-version-prompt), have that Reload action call
`(await navigator.serviceWorker.getRegistration())?.update()` before reloading; otherwise the reload is answered by
the old worker's precache and shows the old build again.

## Host headers

```
/sw.js                 Cache-Control: no-cache
/registerSW.js         Cache-Control: no-cache
/manifest.webmanifest  Cache-Control: no-cache   Content-Type: application/manifest+json
/assets/*              Cache-Control: public, max-age=31536000, immutable
```
