import { NextResponse, type NextRequest } from "next/server";

/**
 * Sends signed-out visitors to the sign-in page before any app page renders. This only
 * checks that a session cookie exists; the API decides on every request whether it is valid
 * and what the person may see (PRD §10.2: UI checks are cosmetic, the backend enforces).
 */
export function proxy(request: NextRequest) {
  // The root decides for itself: the homepage on the platform's address, the app on a company's.
  if (request.nextUrl.pathname === "/" || request.cookies.has("sessionid")) return NextResponse.next();
  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except sign-in, the public user guide, the privacy policy and terms, the closed-account page, API paths forwarded
  // to Django, and static files (robots.txt, sitemap.xml, icons).
  matcher: ["/((?!login|forgot-password|set-password|signup|welcome|guide|closed|privacy|terms|graphql|api/|_next/|favicon\\.ico|.*\\.[a-z0-9]+$).*)"],
};
