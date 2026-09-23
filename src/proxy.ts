import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/database.types";
import { isUserRole, roleHome, rolePrefix } from "@/lib/auth/roles";

/**
 * Next.js 16 request proxy (the file formerly known as middleware.ts).
 *
 * Two jobs:
 *
 *  1. Refresh the Supabase session. Server Components cannot write cookies, so
 *     without this the access token would expire and never be renewed, which
 *     shows up as users being logged out mid-session. `getUser()` below is
 *     deliberately called on every matched request: it is what triggers the
 *     refresh.
 *
 *  2. Coarse route guarding by role, so a student does not land on the admin
 *     shell. This is only an UX layer - Row Level Security is what actually
 *     prevents cross-tenant reads.
 *
 * The role -> prefix and role -> home maps are NOT duplicated here: they come
 * from `@/lib/auth/roles`, the same module the layouts and the sign-in action
 * read. A role that exists in one of them and not the other would be a silent
 * redirect loop, which is exactly the kind of bug this avoids.
 */

const AUTH_ROUTES = ["/login", "/register/school"];

/** Every subtree that belongs to a signed-in role. */
const GUARDED_PREFIXES = Object.values(rolePrefix);

/**
 * Routes an unauthenticated visitor may still see.
 *
 * `/` is included so the landing page stays publicly reachable. Without it,
 * a signed-out visitor would be bounced straight to the login screen and the
 * setup instructions on the landing page would be unreachable - which is
 * exactly the page someone needs when the Supabase project is not connected
 * yet.
 */
function isPublicPath(pathname: string): boolean {
  return pathname === "/" || AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export async function proxy(request: NextRequest) {
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

  const pathname = request.nextUrl.pathname;
  const metadata = user?.app_metadata as Record<string, unknown> | undefined;
  const role = metadata?.role;

  if (!user) {
    // Unauthenticated: allow the public screens, bounce everything else.
    if (isPublicPath(pathname)) {
      return response;
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users have no reason to see the login or sign-up screens.
  // They are redirected home, but the landing page itself stays reachable.
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
    // routed home, so they are sent to the landing page rather than into a
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
     * Run on everything except Next internals and static assets, so that a
     * session refresh happens for navigations but not for every image or
     * font request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf)$).*)",
  ],
};
