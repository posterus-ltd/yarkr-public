# Detection, install store and the mobile install sheet

## `src/pwa/display-mode.ts`

```ts
/** True when the page runs as the installed app rather than in a browser tab. */
export const isStandalone = (): boolean =>
  ["standalone", "fullscreen", "minimal-ui"].some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true; // iOS Safari

export type InstallPlatform =
  | "android-native" // Chromium with a captured beforeinstallprompt
  | "android-manual"
  | "ios-safari"
  | "ios-other" // Chrome, Edge, Firefox on iOS 16.4+
  | "in-app" // Instagram, Facebook, LinkedIn, TikTok, Android WebView: cannot install
  | "desktop"
  | "unsupported";

const IN_APP = /FBAN|FBAV|Instagram|LinkedInApp|TikTok|Line\/|; wv\)/i;

export const detectInstallPlatform = (ua = navigator.userAgent, hasNativePrompt = false): InstallPlatform => {
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1); // iPadOS
  const isAndroid = /Android/.test(ua);

  if (IN_APP.test(ua)) return "in-app";
  if (isIOS) return /CriOS|FxiOS|EdgiOS/.test(ua) ? "ios-other" : /Safari/.test(ua) ? "ios-safari" : "in-app";
  if (isAndroid) return hasNativePrompt ? "android-native" : "android-manual";
  if (window.matchMedia("(pointer: fine)").matches) return "desktop";
  return "unsupported";
};
```

An iOS UA without a `Safari` token is a WebView (an app's in-app browser), so it's treated as `in-app`.

## `src/pwa/install-store.ts`

Imported for its side effect at the top of `main.tsx`, before `createRoot(...).render(...)`.

```ts
import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); // keep Chrome's mini-infobar from racing our sheet
  deferred = event as BeforeInstallPromptEvent;
  emit();
});

window.addEventListener("appinstalled", () => {
  installed = true;
  deferred = null;
  emit();
});

/** Opens the native install dialog. Must run inside a click handler; each event can prompt only once. */
export const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
  if (!deferred) return "unavailable";
  const event = deferred;
  deferred = null;
  emit();
  await event.prompt();
  return (await event.userChoice).outcome;
};

const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

export const useInstall = () => ({
  canPromptNatively: useSyncExternalStore(subscribe, () => deferred !== null),
  installed: useSyncExternalStore(subscribe, () => installed),
});
```

## `src/pwa/dismissal.ts`

```ts
const DISMISS_KEY = "pwa-install-dismissed"; // { at: number, count: number }
const DISMISS_DAYS = 30;
const MAX_AUTO_DISMISSALS = 3;

const readDismissal = (): { at: number; count: number } => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "") ?? { at: 0, count: 0 };
  } catch {
    return { at: 0, count: 0 };
  }
};

export const isDismissed = (now = Date.now()): boolean => {
  const { at, count } = readDismissal();
  return count >= MAX_AUTO_DISMISSALS || now - at < DISMISS_DAYS * 86_400_000;
};

export const recordDismissal = (now = Date.now()): void => {
  try {
    const { count } = readDismissal();
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ at: now, count: count + 1 }));
  } catch {
    // storage blocked: the sheet just shows again next visit
  }
};
```

## `src/pwa/install-prompt.tsx`

```tsx
import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectInstallPlatform, isStandalone } from "./display-mode";
import { promptInstall, useInstall } from "./install-store";
import { isDismissed, recordDismissal } from "./dismissal";
import { InstallSteps } from "./install-steps";

const MOBILE_PLATFORMS = new Set(["android-native", "android-manual", "ios-safari", "ios-other", "in-app"]);

/** Bottom sheet for mobile browser users who haven't installed the app. Mount once, inside the signed-in shell. */
export const InstallPrompt: FC<{ engaged: boolean }> = ({ engaged }) => {
  const { t } = useTranslation("pwa");
  const { canPromptNatively, installed } = useInstall();
  const [open, setOpen] = useState(false);
  const platform = detectInstallPlatform(navigator.userAgent, canPromptNatively);

  useEffect(() => {
    setOpen(engaged && !installed && !isStandalone() && MOBILE_PLATFORMS.has(platform) && !isDismissed());
  }, [engaged, installed, platform]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dismiss = () => {
    recordDismissal();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <section
      role="region"
      aria-label={t("sheet.title")}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md rounded-t-2xl border bg-surface p-4 shadow-lg
                 pb-[calc(1rem+env(safe-area-inset-bottom))] motion-safe:animate-in motion-safe:slide-in-from-bottom"
    >
      <div className="flex items-start gap-3">
        <img src="/pwa-64x64.png" alt="" className="size-10 rounded-lg" />
        <div className="flex-1">
          <h2 className="font-semibold">{t("sheet.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("sheet.body")}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={dismiss} aria-label={t("sheet.close")}>
          <X aria-hidden />
        </Button>
      </div>

      {platform === "android-native" ? (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={dismiss}>{t("sheet.notNow")}</Button>
          <Button onClick={async () => (await promptInstall()) !== "unavailable" && setOpen(false)}>
            {t("sheet.install")}
          </Button>
        </div>
      ) : (
        <InstallSteps platform={platform} className="mt-4" />
      )}
    </section>
  );
};
```

`engaged` comes from the app: for example true on the second session or after sign-in. Don't derive it inside the
sheet; product decides what "engaged" means.

## `src/pwa/install-steps.tsx`

Shared by the sheet and the "Install app" menu dialog. `CopyLinkButton` is the app's copy-to-clipboard button
(`navigator.clipboard.writeText(location.href)` with a "copied" state).

```tsx
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { EllipsisVertical, Share, SquarePlus } from "lucide-react";
import type { InstallPlatform } from "./display-mode";

const ICONS = { share: Share, add: SquarePlus, menu: EllipsisVertical } as const;
type Step = { icon?: keyof typeof ICONS; text: string };

export const InstallSteps: FC<{ platform: InstallPlatform; className?: string }> = ({ platform, className }) => {
  const { t } = useTranslation("pwa");

  if (platform === "in-app") {
    return (
      <div className={className}>
        <p className="text-sm">{t("inApp.body")}</p>
        <CopyLinkButton label={t("inApp.copyLink")} copiedLabel={t("inApp.copied")} />
      </div>
    );
  }

  const key = { "ios-safari": "iosSafari", "ios-other": "iosOther", "android-manual": "androidManual" }[platform as string];
  if (!key) return null;
  const steps = t(`steps.${key}`, { returnObjects: true }) as Step[];

  return (
    <ol className={`list-decimal space-y-2 pl-5 text-sm ${className ?? ""}`}>
      {steps.map(({ icon, text }) => {
        const Icon = icon ? ICONS[icon] : null;
        return (
          <li key={text}>
            {text} {Icon && <Icon aria-hidden className="inline size-4 align-text-bottom" />}
          </li>
        );
      })}
    </ol>
  );
};
```

## `src/locales/en/pwa.json` (excerpt)

```json
{
  "sheet": {
    "title": "Install Planner",
    "body": "Get Planner on your home screen: it opens full screen, faster, and works offline.",
    "install": "Install",
    "notNow": "Not now",
    "close": "Close"
  },
  "steps": {
    "iosSafari": [
      { "icon": "share", "text": "Tap Share at the bottom of the screen" },
      { "icon": "add", "text": "Scroll down and tap Add to Home Screen" },
      { "text": "Tap Add. You'll sign in once more in the installed app." }
    ],
    "iosOther": [
      { "icon": "share", "text": "Tap Share in the address bar or menu" },
      { "icon": "add", "text": "Tap Add to Home Screen" },
      { "text": "Don't see it? Open this page in Safari and try there." }
    ],
    "androidManual": [
      { "icon": "menu", "text": "Open the browser menu" },
      { "text": "Tap Install app or Add to Home screen" }
    ]
  },
  "inApp": {
    "body": "This in-app browser can't install apps. Open the page in Safari or Chrome to install Planner.",
    "copyLink": "Copy link",
    "copied": "Link copied"
  },
  "menu": { "installApp": "Install app" }
}
```
