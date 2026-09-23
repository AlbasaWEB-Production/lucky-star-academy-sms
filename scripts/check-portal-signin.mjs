/**
 * Portal sign-in smoke test.
 *
 * `src/proxy.ts` is auth-critical: it refreshes the Supabase session and guards
 * every role's route subtree. The public website work changed that file — adding
 * host-based routing, a fast path for anonymous visitors to the website, and a
 * change to what happens when an unauthenticated visitor requests a path that is
 * not a portal route. None of that is supposed to touch sign-in, and "none of
 * that is supposed to" is exactly the kind of claim that needs evidence rather
 * than review.
 *
 * So this drives a real browser through the real form against the real Supabase
 * project, and asserts the four things that would break if the proxy regressed:
 *
 *   1. signing in as an admin lands on the admin dashboard;
 *   2. the dashboard renders as the signed-in user rather than bouncing back to
 *      the sign-in screen;
 *   3. a signed-in user can still read the public website, and is not redirected
 *      off it;
 *   4. the sign-in screen redirects a signed-in user home — the `AUTH_ROUTES`
 *      branch that was edited.
 *
 * The credentials are the seeded development accounts, the same ones
 * `scripts/verify-rls.mjs` already uses. They are development data.
 *
 * Requires a Chrome with the DevTools Protocol open, and a running server:
 *
 *   npx next start -p 3100
 *   chrome --headless=new --remote-debugging-port=9224 --user-data-dir=<temp> about:blank
 *   node scripts/check-portal-signin.mjs
 */

const CDP_PORT = Number(process.env.CDP_PORT ?? 9224);
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3100";

const ADMIN = { email: "admin@luckystaracademy.edu.gh", password: "Admin@2026" };

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

async function evaluate(ws, expression) {
  const { result, exceptionDetails } = await send(ws, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text ?? "evaluation threw");
  return result.value;
}

async function goto(ws, url) {
  await send(ws, "Page.navigate", { url });
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await new Promise((r) => setTimeout(r, 100));
    if ((await evaluate(ws, "document.readyState")) === "complete") return;
  }
  throw new Error(`timed out loading ${url}`);
}

const results = [];

function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

/**
 * React controls the value of these inputs, so assigning `.value` directly is
 * discarded on the next render. Calling the prototype's own setter and then
 * dispatching `input` is what React listens for.
 */
const FILL_FORM = `(() => {
  const set = (selector, value) => {
    const el = document.querySelector(selector);
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };
  const okEmail = set('input[name="email"]', ${JSON.stringify(ADMIN.email)});
  const okPassword = set('input[name="password"]', ${JSON.stringify(ADMIN.password)});
  return okEmail && okPassword;
})()`;

async function main() {
  const ws = await connect(await pageTarget());
  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");
  await send(ws, "Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  /* 1. Sign in ------------------------------------------------------------ */
  await goto(ws, `${BASE}/login/admin`);

  const filled = await evaluate(ws, FILL_FORM);
  check("sign-in form is present and fillable", filled === true);

  await evaluate(ws, `document.querySelector("form").requestSubmit()`);

  let pathname = "/login/admin";
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((r) => setTimeout(r, 250));
    pathname = await evaluate(ws, "location.pathname");
    if (pathname !== "/login/admin") break;
  }

  if (pathname === "/login/admin") {
    const message = await evaluate(
      ws,
      `(document.body.innerText || "").replace(/\\s+/g, " ").slice(0, 300)`,
    );
    check("signing in as admin leaves the sign-in screen", false, `still on ${pathname}. Page says: ${message}`);
  } else {
    check("signing in as admin leaves the sign-in screen", true, `now at ${pathname}`);
  }

  check("signing in as admin lands on the admin dashboard", pathname === "/admin/dashboard", pathname);

  /* 2. The dashboard renders as that user -------------------------------- */
  const dashboard = await evaluate(
    ws,
    `(document.body.innerText || "").replace(/\\s+/g, " ").slice(0, 400)`,
  );
  check(
    "the dashboard renders signed-in content",
    typeof dashboard === "string" && dashboard.length > 0 && !/sign in/i.test(dashboard.slice(0, 120)),
    dashboard.slice(0, 90),
  );

  /* 3. A signed-in user can still read the public website ---------------- */
  await goto(ws, `${BASE}/about`);
  const sitePath = await evaluate(ws, "location.pathname");
  const siteText = await evaluate(
    ws,
    `(document.body.innerText || "").replace(/\\s+/g, " ").slice(0, 300)`,
  );
  check("a signed-in user is not redirected off the public website", sitePath === "/about", sitePath);
  check(
    "the public About page renders for a signed-in user",
    typeof siteText === "string" && /About our school|Yendi/i.test(siteText),
    siteText.slice(0, 90),
  );

  /* 4. The sign-in screen still bounces a signed-in user home ------------ */
  await goto(ws, `${BASE}/login/admin`);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((r) => setTimeout(r, 150));
    if ((await evaluate(ws, "location.pathname")) !== "/login/admin") break;
  }
  const afterLogin = await evaluate(ws, "location.pathname");
  check(
    "the sign-in screen redirects a signed-in user to their portal home",
    afterLogin === "/admin/dashboard",
    afterLogin,
  );

  ws.close();

  const failed = results.filter((r) => !r.passed);
  console.log("");
  if (failed.length === 0) {
    console.log(`Portal sign-in intact: ${results.length}/${results.length} checks passed.`);
  } else {
    console.log(`${failed.length} of ${results.length} checks failed.`);
  }
  return failed.length === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error);
    process.exit(2);
  });
