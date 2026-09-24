/**
 * Layout guard: does any public page force horizontal scrolling?
 *
 * `PAGE-CONVENTIONS.md` requires every page to work at 360px with "no element
 * forcing horizontal page scroll". That is not checkable by reading markup —
 * it is a property of the rendered box tree, and it fails silently: the page
 * still loads, still scores 100 on accessibility, and simply cuts the right-hand
 * side off every section. That is exactly what happened here: the public site's
 * header reserved space for a hidden lockup *and* kept a second button in the
 * bar, which pushed the menu control past the right edge and made the whole
 * document ~20px wider than a 390px phone. Every section on every page was
 * clipped, and nothing in the HTML looked wrong.
 *
 * So this renders each page at several widths in a real browser and reports the
 * document's scroll width against the viewport, plus the outermost elements
 * responsible.
 *
 * Usage:
 *   npx next start -p 3100 &
 *   chrome --headless=new --remote-debugging-port=9222 about:blank &
 *   node scripts/check-layout.mjs
 *
 * Exits non-zero if any page overflows at any width, so it can gate a deploy.
 */

const CDP_PORT = Number(process.env.CDP_PORT ?? 9222);
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";

const PATHS = [
  "/",
  "/about",
  "/academics",
  "/admissions",
  "/staff",
  "/news",
  "/gallery",
  "/contact",
  "/nope",
];

/**
 * 360 is the documented floor; 390 and 768 are common real devices.
 *
 * 900 and 1024 are here because of a gap this script had: MUI's `md` breakpoint
 * is 900px, which is where the desktop navigation appears and where the header
 * is at its tightest — eight links plus the call to action in the least space
 * they ever get. Testing 768 and 1440 skipped exactly that case.
 */
const WIDTHS = [360, 390, 768, 900, 1024, 1440];

/** One pixel of sub-pixel rounding is not an overflow. */
const TOLERANCE = 1;

const PROBE = `(() => {
  const doc = document.documentElement;
  const vw = doc.clientWidth;
  const sw = Math.max(doc.scrollWidth, document.body ? document.body.scrollWidth : 0);
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.right > vw + ${TOLERANCE}) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 44),
        width: Math.round(rect.width),
        right: Math.round(rect.right),
      });
    }
  }
  return JSON.stringify({ vw, sw, offenders: offenders.slice(0, 5), total: offenders.length });
})()`;

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
    ws.addEventListener("error", (event) => reject(new Error(String(event.message ?? "ws error"))));
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

/** Navigate and wait until the document has finished loading. */
async function goto(ws, url) {
  await send(ws, "Page.navigate", { url });
  for (let attempt = 0; attempt < 60; attempt += 1) {
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
  const ws = await connect(await pageTarget());
  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");

  const failures = [];
  let checks = 0;

  for (const width of WIDTHS) {
    await send(ws, "Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });

    for (const path of PATHS) {
      await goto(ws, `${BASE}${path}`);
      const { result } = await send(ws, "Runtime.evaluate", {
        expression: PROBE,
        returnByValue: true,
      });
      const { vw, sw, offenders, total } = JSON.parse(result.value);
      checks += 1;

      const overflow = sw - vw;
      if (overflow > TOLERANCE) {
        failures.push({ width, path, overflow, offenders, total });
        console.log(`FAIL ${String(width).padStart(4)}px ${path.padEnd(14)} scrollWidth ${sw} > ${vw}`);
        for (const o of offenders) {
          console.log(`       ${o.tag} w=${o.width} right=${o.right} "${o.text}"`);
        }
        if (total > offenders.length) console.log(`       … and ${total - offenders.length} more`);
      } else {
        console.log(`ok   ${String(width).padStart(4)}px ${path.padEnd(14)} scrollWidth ${sw}`);
      }
    }
  }

  await send(ws, "Emulation.clearDeviceMetricsOverride");
  ws.close();

  console.log("");
  if (failures.length === 0) {
    console.log(`No horizontal overflow across ${checks} checks.`);
    return 0;
  }

  console.log(`${failures.length} of ${checks} checks overflow horizontally.`);
  return 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error);
    process.exit(2);
  });
