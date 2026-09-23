/**
 * Screenshot the public website.
 *
 * The repository has committed screenshots of its dashboards (see
 * `DECISIONS.md` § 15), and the reason recorded there applies here too: several
 * rendering defects were invisible in code review *and* in the previous
 * screenshots, and only appeared once a widget rendered with data that
 * exercised it. A screenshot you can re-take on demand is how that gets caught.
 *
 * Chrome's `--screenshot` flag is not used because it silently ignores
 * `--window-size` when another Chrome instance is running — it produced 762×484
 * images for every requested size, which looks like a working screenshot until
 * you notice every page has the same dimensions. Driving the DevTools Protocol
 * instead gives an exact viewport and a true full-page capture.
 *
 * Usage:
 *   chrome --headless=new --remote-debugging-port=9223 --user-data-dir=<temp> about:blank &
 *   node scripts/shoot.mjs                # all pages, phone + desktop
 *   node scripts/shoot.mjs --out "Claude outputs/site" --width 390
 *   node scripts/shoot.mjs --format png   # lossless, ~6x the size
 *
 * JPEG by default, at quality 85. These are full-page captures of pages whose
 * hero is a photograph, which is the worst case for PNG: the same sixteen images
 * were 10.5 MB as PNG against 2.3 MB for the entire rest of the repository's
 * committed screenshots. Nothing here is a pixel-exact UI reference — they exist
 * to show layout and content — so the trade is worth it. Pass `--format png`
 * when a capture needs to be lossless.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CDP_PORT = Number(process.env.CDP_PORT ?? 9223);
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";

const PAGES = [
  ["home", "/"],
  ["about", "/about"],
  ["academics", "/academics"],
  ["admissions", "/admissions"],
  ["news", "/news"],
  ["gallery", "/gallery"],
  ["contact", "/contact"],
  ["not-found", "/a-page-that-does-not-exist"],
];

function readFlag(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const OUT_DIR = readFlag("out", "Claude outputs/site");
const FORMAT = readFlag("format", "jpeg");
const QUALITY = Number(readFlag("quality", 85));
const EXTENSION = FORMAT === "jpeg" ? "jpg" : "png";
const WIDTHS = readFlag("width", "390,1440")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);

async function pageTarget() {
  const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
  const targets = await response.json();
  const page = targets.find((t) => t.type === "page");
  if (!page) throw new Error("no page target — is Chrome running with --remote-debugging-port?");
  return page.webSocketDebuggerUrl;
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener("open", () => resolve(ws));
    ws.addEventListener("error", () => reject(new Error("could not open the CDP socket")));
  });
}

let nextId = 0;

function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id !== id) return;
      ws.removeEventListener("message", onMessage);
      if (data.error) reject(new Error(`${method}: ${data.error.message}`));
      else resolve(data.result);
    };
    ws.addEventListener("message", onMessage);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function goto(ws, url) {
  await send(ws, "Page.navigate", { url });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await new Promise((r) => setTimeout(r, 100));
    const { result } = await send(ws, "Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true,
    });
    if (result.value === "complete") return;
  }
  throw new Error(`timed out loading ${url}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const ws = await connect(await pageTarget());
  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");

  // Blocks wrapped in `Reveal` start at `opacity: 0` and are unhidden by an
  // IntersectionObserver when they scroll into view. A full-page capture never
  // scrolls, so everything below the first screen would photograph as blank —
  // which reads as a broken page rather than as an un-triggered animation.
  //
  // Emulating `prefers-reduced-motion: reduce` makes `Reveal` render its final
  // state immediately, which is the same path a motion-sensitive visitor gets.
  await send(ws, "Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  for (const width of WIDTHS) {
    for (const [name, path] of PAGES) {
      // The viewport is reset to a short window *per page*, before navigating.
      // Setting it once per width is a trap: the previous page's content height
      // stays as the viewport height, and `cssContentSize` then reports that
      // height for every subsequent page — so all screenshots come out the same
      // size, which looks like a successful run until you compare two of them.
      await send(ws, "Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });

      await goto(ws, `${BASE}${path}`);

      const { cssContentSize } = await send(ws, "Page.getLayoutMetrics");

      // Resize the viewport to the full page and load it again before
      // capturing. Every image below the fold is `loading="lazy"`, and a
      // full-page capture does not scroll — so with a 900px viewport the crest
      // in the footer and the banner in the gallery photograph as blank gaps,
      // which looks exactly like a broken image rather than an unloaded one.
      // With the viewport as tall as the page, nothing is off-screen and
      // everything loads.
      const fullHeight = Math.min(Math.ceil(cssContentSize.height), 12000);
      await send(ws, "Emulation.setDeviceMetricsOverride", {
        width,
        height: fullHeight,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });

      await goto(ws, `${BASE}${path}`);

      // Navigation completing is not the same as images finishing.
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const { result } = await send(ws, "Runtime.evaluate", {
          expression:
            "Array.from(document.images).every((i) => i.complete && i.naturalWidth > 0)",
          returnByValue: true,
        });
        if (result.value === true) break;
        await new Promise((r) => setTimeout(r, 100));
      }

      // `captureBeyondViewport` captures the whole page, so the viewport height
      // does not have to be resized to match it.
      const { data } = await send(ws, "Page.captureScreenshot", {
        format: FORMAT,
        ...(FORMAT === "jpeg" ? { quality: QUALITY } : {}),
        captureBeyondViewport: true,
      });

      const file = join(OUT_DIR, `${name}-${width}.${EXTENSION}`);
      await writeFile(file, Buffer.from(data, "base64"));
      console.log(`${file}  ${width}×${fullHeight}`);
    }
  }

  await send(ws, "Emulation.clearDeviceMetricsOverride");
  ws.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
