---
name: spa-pwa-install
description: Turn a Vite single-page app into an installable Progressive Web App (web app manifest, generated icons, iOS meta tags, a vite-plugin-pwa service worker with a reload-on-update prompt) and show mobile visitors who are not using the installed app a dismissible prompt with platform-specific install steps (native install button on Android Chromium, Share → Add to Home Screen on iOS, "open in your browser" in in-app browsers). Use when adding PWA support, "Add to Home Screen", an install banner or install button, offline app shell, standalone display mode, or when the app isn't installable in Chrome or Safari.
---

# SPA PWA + Install Prompt

Two parts that ship together:

1. **Make the app installable**: a web app manifest, icons, iOS head tags and a service worker that precaches the app
   shell and asks before updating.
2. **Tell mobile users they can install it**: when the page runs in a mobile browser tab rather than as the installed
   app, show a small dismissible sheet with the steps that fit their platform, and keep a permanent "Install app"
   entry in a menu for users who dismissed it.

Stack assumed: Vite 5+, React, TypeScript, [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (Workbox),
`@vite-pwa/assets-generator`, Tailwind, react-i18next, `lucide-react`, `sonner`. Swap equivalents freely; keep the
structure.

## 1. File layout

```
vite.config.ts                  # VitePWA({...}): manifest, workbox, registerType: "prompt"
pwa-assets.config.ts            # icon generation from one source image
public/
  logo.svg                      # source icon (square, with padding for maskable)
  pwa-*.png, apple-touch-icon-180x180.png, maskable-icon-512x512.png, favicon.ico   # generated
index.html                      # theme-color, apple-touch-icon, viewport-fit=cover
src/
  pwa/display-mode.ts           # isStandalone(), detectInstallPlatform()
  pwa/install-store.ts          # captures beforeinstallprompt / appinstalled; useInstall() hook
  pwa/dismissal.ts              # 30-day dismissal window in localStorage
  pwa/register-sw.ts            # registers the service worker, hooks updates into the new-version toast
  pwa/install-prompt.tsx        # the mobile install sheet
  pwa/install-steps.tsx         # per-platform step lists, shared by the sheet and the menu dialog
  locales/en/pwa.json           # every UI string
  main.tsx                      # imports install-store before render; mounts <InstallPrompt />
```

```bash
pnpm add -D vite-plugin-pwa @vite-pwa/assets-generator
```

## 2. Make it installable, in this order

1. **Icons** from one square source image: `pwa-assets-generator --preset minimal-2023 public/logo.svg` (or
   `pwa-assets.config.ts` + `pwaAssets: { config: true }` in the plugin). It produces 64/192/512 `any` icons, a 512
   maskable icon, a 180 px `apple-touch-icon` and `favicon.ico`. Keep the logo inside the central 80 % so the maskable
   crop doesn't cut it.
2. **Manifest** through `VitePWA({ manifest })`: `id`, `name`, `short_name` (≤ 12 chars, it's the home-screen label),
   `description`, `start_url`, `scope`, `display: "standalone"`, `theme_color`, `background_color`, the icons with
   `purpose: "any"` and `"maskable"` as separate entries. Optional: `screenshots` (wide + narrow) for Chrome's richer
   install dialog, `shortcuts` for long-press actions. Code: [references/vite-config.md](references/vite-config.md).
3. **Head tags** in `index.html`: `<meta name="theme-color">` (one per colour scheme with `media`), `<link
   rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">`, `<meta name="apple-mobile-web-app-title">`,
   `viewport-fit=cover` in the viewport meta, and pad fixed headers/footers with `env(safe-area-inset-*)`.
4. **Service worker** with `registerType: "prompt"`: precache the build (`globPatterns` incl. `woff2`, `svg`,
   `webmanifest`), `navigateFallback: "index.html"` so deep links work offline, and a `navigateFallbackDenylist` for
   `/api/`, `/version.json`, `.txt` files and anything the server must answer itself. API calls stay network-only
   unless you deliberately add a runtime cache.
5. **Updates ask, never force.** `register-sw.ts` uses `registerSW({ onNeedRefresh })` from `virtual:pwa-register`;
   `onNeedRefresh` shows the same `id: "new-version"` toast as `spa-new-version-prompt`, and Reload calls
   `updateSW(true)` (activates the waiting worker, then reloads). If the app also polls `version.json`, its Reload
   should call `registration.update()` first so the new worker is fetched. Code: same reference.
6. **Hosting**: serve `sw.js`, `registerSW.js` and `manifest.webmanifest` with `Cache-Control: no-cache`, the manifest
   as `application/manifest+json`, everything over HTTPS. Hashed `assets/*` keep long-lived immutable caching.

Chrome's install criteria: HTTPS, a manifest with `name` or `short_name`, 192 and 512 px icons, `start_url`,
`display` of `standalone`/`fullscreen`/`minimal-ui`, and no `prefer_related_applications: true`. Safari installs any
page via Add to Home Screen but uses the manifest for name, icon and display mode.

## 3. Install prompt for mobile browser users

**Who sees it:** on a phone or tablet, not already running as the installed app (`isStandalone()` false), not
dismissed recently, and only after some engagement (second visit, or after a first meaningful action such as signing
in). Never on the first paint of the landing page, and never on desktop (desktop gets the menu entry only).

**What they see** depends on `detectInstallPlatform()`:

| Platform | Detection | Prompt |
| --- | --- | --- |
| Android, Chromium (Chrome, Edge, Samsung Internet) with a captured `beforeinstallprompt` | event stored | **Install** button → `deferred.prompt()`; then `await deferred.userChoice` |
| Android, no event (Firefox, criteria not met yet, event already used) | Android UA, no event | Steps: browser menu ⋮ → **Install app** / **Add to Home screen** |
| iOS / iPadOS, Safari | iOS UA without `CriOS`/`FxiOS`/`EdgiOS` | Steps: **Share** (square with arrow) → **Add to Home Screen** → **Add** |
| iOS / iPadOS, Chrome, Edge or Firefox (iOS 16.4+) | `CriOS`/`EdgiOS`/`FxiOS` | Steps: **Share** in the address bar or menu → **Add to Home Screen**; if it's missing, open the page in Safari |
| In-app browser (Instagram, Facebook, LinkedIn, TikTok, Android WebView) | UA tokens | "Open this page in Safari / Chrome to install", with a **Copy link** button |
| Anything else | | No prompt |

Show the steps with the matching icons inline (`Share`, `SquarePlus`, `EllipsisVertical` from lucide) so users can
match them to what they see. On iOS, point the sheet at the Share button: bottom of the screen on iPhone Safari,
top-right on iPad.

**Behaviour:**
- Capture `beforeinstallprompt` **at module load**, before React renders: it can fire before any component mounts.
  Call `preventDefault()` so Chrome's mini-infobar doesn't race your UI, and keep the event in a small store.
- `prompt()` only works once per event and only inside a user gesture. Afterwards clear the event.
- Listen for `appinstalled`: hide the sheet and record that the app is installed.
- **Dismiss** stores a timestamp (`localStorage`, wrapped in try/catch) and hides the sheet for 30 days, as a named
  constant. Three dismissals: stop showing the sheet automatically; the menu entry stays.
- A permanent **Install app** item in the profile/help menu opens the same steps in a dialog, on every platform where
  `isStandalone()` is false, including desktop Chromium (native button) and desktop Safari 17+ (File → Add to Dock).
- The sheet is a non-modal bottom banner (`role="region"` with an `aria-label`, not a focus-trapping dialog), above
  the safe-area inset, closable with a visible ✕ and Escape, and doesn't cover primary actions or the cookie banner.

Code for detection, the store and the sheet: [references/install-prompt.md](references/install-prompt.md).

## 4. i18n

```
pwa: {
  sheet: { title, body, install, notNow, close },
  steps: { iosSafari: [..], iosOther: [..], androidManual: [..], desktopSafari: [..] },
  inApp: { title, body, copyLink, copied },
  menu: { installApp },
  update: { title, description, reload }      // or reuse common:newVersion from spa-new-version-prompt
}
```

Use the browser's own words for menu items ("Add to Home Screen", "Install app") in each language, since that's what
users see in their browser UI.

## Pitfalls

- **`beforeinstallprompt` listener registered in a component.** The event fired before mount and is gone. Register at
  module load.
- **Showing the prompt inside the installed app.** Check all display modes (`standalone`, `fullscreen`, `minimal-ui`)
  plus `navigator.standalone` for iOS. Also check on the server-rendered first frame: render nothing until mounted.
- **iPadOS pretends to be a Mac.** Its Safari UA says `Macintosh`; treat `Macintosh` with `navigator.maxTouchPoints >
  1` as iOS.
- **iOS in-app browsers** have no Add to Home Screen at all. Don't show Safari steps there; send users to Safari.
- **iOS storage is separate.** A home-screen app on iOS doesn't share cookies or `localStorage` with Safari, so users
  sign in again after installing. Say so in the iOS copy, and make sure sign-in works inside the standalone app
  (OAuth redirects that open a new window break; use same-window redirects).
- **`registerType: "autoUpdate"`** reloads under the user when a new worker activates and can drop unsaved input. Use
  `"prompt"`.
- **Service worker serving a stale `version.json`** or rewriting `/api/*` navigations to `index.html`. Keep them in
  `navigateFallbackDenylist` and out of precache.
- **Long-cached `sw.js`.** A CDN caching the worker for a day delays every update by a day.
- **Testing on `localhost` only.** Phones need HTTPS; use a deployed preview or a tunnel, and `vite preview` (the
  service worker is off in `vite dev` unless `devOptions.enabled`).
- **Lighthouse has no PWA category any more** (removed in Lighthouse 12). Check installability in DevTools →
  Application → Manifest instead.
- **Nagging.** A sheet on every visit is the fastest way to get the site blocked; respect the dismissal window.

## Checklist

- [ ] DevTools → Application → Manifest shows no installability errors; icons (incl. maskable) render correctly.
- [ ] Android Chrome: the sheet shows an **Install** button; tapping it opens the native dialog; after installing,
      the sheet is gone and the app opens standalone with the right name, icon, theme and splash colour.
- [ ] iOS Safari (iPhone and iPad): the sheet shows Share → Add to Home Screen steps; the home-screen app opens
      standalone with the 180 px icon and respects safe areas (notch, home indicator).
- [ ] iOS Chrome shows the iOS-other steps; Instagram's in-app browser shows "open in Safari" with a working Copy link.
- [ ] Android Firefox shows the manual menu steps.
- [ ] No sheet inside the installed app, on desktop, or within 30 days of a dismissal; the menu entry still works.
- [ ] Offline: the installed app opens and deep links render the shell; API calls fail with the app's normal error UI.
- [ ] Deploying a new build shows the new-version toast (once); Reload activates the new worker and loads the new build.
- [ ] `sw.js` and `manifest.webmanifest` are served `no-cache`; the manifest as `application/manifest+json`.
- [ ] Co-located tests (vitest): `detectInstallPlatform()` for each UA in the table (incl. iPadOS-as-Mac),
      `isStandalone()` with stubbed `matchMedia`, dismissal window with fake timers, `beforeinstallprompt` captured
      before render and cleared after `prompt()`.
- [ ] `typecheck`, `test` and `lint` pass; the sheet looks right in light and dark mode at 320 px and doesn't overlap
      the cookie banner.
