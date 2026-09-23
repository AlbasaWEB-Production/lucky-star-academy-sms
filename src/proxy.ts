import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";
import { isUserRole, roleHome, rolePrefix } from "@/lib/auth/roles";
import { hostZone, PORTAL_ORIGIN, SITE_ORIGIN } from "@/lib/site/host";
import { isPortalPath, isSitePath } from "@/lib/site/routes";

/**
 * Next.js 16 request proxy (the file formerly known as middleware.ts).
 *
 * Three jobs:
 *
 *  1. Keep the public website and the school management system on their own
 *     hostnames. `luckystaracademy.edu.gh` serves the brochure; the portal lives
 *     at `portal.luckystaracademy.edu.gh`. This runs first because it is the
 *     cheapest decision and the one that must hold even when Supabase is not
 *     reachable.
 *
 *  2. Refresh the Supabase session. Server Components cannot write cookies, so
 *     without this the access token would expire and never be renewed, which
 *     shows up as users being logged out mid-session. `getUser()` below is
 *     deliberately called on every matched request: it is what triggers the
 *     refresh.
 *
 *  3. Coarse route guarding by role, so a student does not land on the admin
 *     shell. This is only an UX layer - Row Level Security is what actually
 *     prevents cross-tenant reads.
 *
 * The role -> prefix and role -> home maps are NOT duplicated here: they come
 * from `@/lib/auth/roles`, the same module the layouts and the sign-in action
 * read. A role that exists in one of them and not the other would be a silent
 * redirect loop, which is exactly the kind of bug this avoids. The same rule now
 * covers the public site's routes, which come from `@/lib/site/routes`.
 */

const AUTH_ROUTES = ["/login", "/register/school"];

/** Every subtree that belongs to a signed-in role. */
const GUARDED_PREFIXES = Object.values(rolePrefix);

/**
 * Routes an unauthenticated visitor may still see.
 *
 * The whole public website, plus the auth screens. `/` is part of `SITE_PATHS`,
 * so a signed-out visitor reaches the brochure rather than being bounced to a
 * login screen.
 */
function isPublicPath(pathname: string): boolean {
  return isSitePath(pathname) || AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Does this request carry a Supabase session cookie?
 *
 * Only used to decide whether a session refresh could possibly be needed. The
 * name is checked loosely (prefix and suffix, not an exact project reference)
 * because `@supabase/ssr` chunks long tokens as `sb-<ref>-auth-token.0`,
 * `.1`, … and a stricter match would silently stop refreshing large sessions.
 */
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const zone = hostZone(request.headers.get("host"));

  /* ---------------------------------------------------------------------- */
  /*  1. Host split                                                          */
  /* ---------------------------------------------------------------------- */

  // On a deployment whose environment variables are unset — localhost, and every
  // Vercel preview — `hostZone` returns "single" and none of this applies, so
  // both halves of the app stay reachable at the root exactly as before.
  if (zone === "portal") {
    // The portal host opens on the sign-in chooser, not on the school's brochure.
    if (pathname === "/") {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.search = "";
      return NextResponse.redirect(login);
    }

    // The brochure lives on the website. Serving it from the portal hostname too
    // would put the school's marketing pages on two origins, which splits search
    // ranking and gives the portal an indexable front door.
    if (isSitePath(pathname)) {
      return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, SITE_ORIGIN));
    }
  }

  if (zone === "public" && isPortalPath(pathname)) {
    // Sign-in, registration and every role portal belong to the other hostname.
    return NextResponse.redirect(new URL(`${pathname}${request.nextUrl.search}`, PORTAL_ORIGIN));
  }

  /* ---------------------------------------------------------------------- */
  /*  2. Public website pages do not need the session refresh                */
  /* ---------------------------------------------------------------------- */

  // A visitor with no session cookie has no session to renew, so the Supabase
  // round trip would be pure latency added to every page of the school's public
  // website — the one surface where first-load speed is what a parent on mobile
  // data actually feels. A signed-in user reading a public page still gets the
  // refresh, so their session is not shortened by browsing the brochure.
  if (isSitePath(pathname) && !hasSessionCookie(request)) {
    return NextResponse.next();
  }

  /* ---------------------------------------------------------------------- */
  /*  3. Session refresh and role guarding                                   */
  /* ---------------------------------------------------------------------- */

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Before the Supabase project is connected there is nothing to refresh and
  // no session to read. Passing through keeps the setup screens reachable
  // instead of turning every request into a 500.
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Propagate the refreshed cookies onto both the mutated request (so
        // this pass sees them) and the outgoing response (so the browser
        // stores them).
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        // Supabase supplies no-store cache headers here. Applying them stops
        // a CDN or reverse proxy from caching a response that carries one
        // user's session cookies and serving it to someone else.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.app_metadata as Record<string, unknown> | undefined;
  const role = metadata?.role;

  if (!user) {
    // Unauthenticated. Two cases pass through untouched:
    //
    //   - the public website and the auth screens; and
    //   - anything that is not a portal route at all, which then falls through
    //     to the not-found page.
    //
    // That second case used to be a redirect to `/login`, which meant a parent
    // who mistyped the school's address was shown a staff sign-in form instead
    // of the website's own "page not found". Only a route that genuinely
    // belongs to the portal now bounces to sign-in, so nothing is exposed: the
    // guard is a UX layer, and RLS plus authentication remain the enforcement.
    if (isPublicPath(pathname) || !isPortalPath(pathname)) {
      return response;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users have no reason to see the login or sign-up screens.
  // They are redirected home, but the public website stays reachable.
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const home = request.nextUrl.clone();
    home.pathname = isUserRole(role) ? roleHome[role] : "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  // Confine each role to its own route subtree.
  if (isUserRole(role)) {
    for (const [requiredRole, prefix] of Object.entries(rolePrefix)) {
      if (pathname.startsWith(prefix) && role !== requiredRole) {
        const home = request.nextUrl.clone();
        home.pathname = roleHome[role];
        home.search = "";
        return NextResponse.redirect(home);
      }
    }
  } else if (GUARDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    // A signed-in user whose app_metadata carries no usable role cannot be
    // routed home, so they are sent to the public website rather than into a
    // subtree whose data they would fail to read anyway.
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next internals, static assets, and the two
     * machine-readable files at the site root.
     *
     * `robots.txt` and `sitemap.xml` are excluded deliberately. They are not
     * pages: they need no session, no role check and no host split, so running
     * the proxy on them does nothing but add a Supabase round trip — and it
     * previously did worse than that. A crawler requesting `/robots.txt` has no
     * session cookie, so the old matcher sent it to `/login`, and the
     * school's robots file answered with an HTML login page. Silent, and
     * invisible unless the file is actually fetched.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|xml|txt)$).*)",
  ],
};
