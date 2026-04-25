/**
 * Runtime placeholder detector.
 *
 * If the rendered DOM still looks like the Lovable/Vite placeholder shell
 * (e.g. publish served a stale or wrong bundle), show a banner so the issue
 * is obvious instead of silently shipping a broken site.
 */

const PLACEHOLDER_SIGNS = [
  "lovable-placeholder",
  "gpt-engineer",
  "Vite + React",
  "Vite App",
  "Edit src/App",
];

const APP_TITLE_HINT = "LookMotoTour";

function looksLikePlaceholder(): boolean {
  const root = document.getElementById("root");
  // Empty root long after mount is itself a red flag.
  const rootEmpty = !root || root.childElementCount === 0;

  const html = document.documentElement.innerHTML;
  const hasPlaceholderMarker = PLACEHOLDER_SIGNS.some((s) =>
    html.includes(s),
  );

  const titleOk = document.title.includes(APP_TITLE_HINT);

  return hasPlaceholderMarker || (rootEmpty && !titleOk);
}

function showBanner(reason: string) {
  if (document.getElementById("__placeholder_banner__")) return;
  const el = document.createElement("div");
  el.id = "__placeholder_banner__";
  el.setAttribute("role", "alert");
  el.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "right:0",
    "z-index:2147483647",
    "padding:12px 16px",
    "background:hsl(0 84% 45%)",
    "color:hsl(0 0% 100%)",
    "font:600 14px/1.4 system-ui,sans-serif",
    "text-align:center",
    "box-shadow:0 2px 12px rgba(0,0,0,0.25)",
  ].join(";");
  el.textContent =
    `⚠️ Placeholder content detected (${reason}). The published bundle may be stale — please re-publish.`;
  document.body.appendChild(el);
  // eslint-disable-next-line no-console
  console.error("[placeholderGuard] Placeholder detected:", reason);
}

export function installPlaceholderGuard() {
  if (typeof window === "undefined") return;

  const check = () => {
    try {
      if (looksLikePlaceholder()) {
        const root = document.getElementById("root");
        const reason = !root || root.childElementCount === 0
          ? "app root not mounted"
          : "placeholder markers in DOM";
        showBanner(reason);
      }
    } catch {
      // ignore
    }
  };

  // Run after first paint and once more a moment later, in case async chunks
  // are still resolving.
  setTimeout(check, 1500);
  setTimeout(check, 5000);
}
