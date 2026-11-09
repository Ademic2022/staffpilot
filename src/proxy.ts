import { NextResponse, type NextRequest } from "next/server";

// The Django API. In production the web app (Vercel) forwards API calls to it; in development
// it is the local server.
const API_ORIGIN = (process.env.API_ORIGIN ?? "http://127.0.0.1:8000").replace(/\/$/, "");
// Shared with Django (API_PROXY_SECRET there too). It lets Django believe the company address
// and visitor IP sent below; without it they are ignored.
const PROXY_SECRET = process.env.API_PROXY_SECRET;

const isApi = (path: string) => path === "/graphql" || path.startsWith("/graphql/") || path.startsWith("/api/");

/**
 * Forwards API calls to Django, naming the address the visitor used (it picks the company) and
 * the visitor's IP. Hosting providers may rewrite the usual X-Forwarded-* headers on the way,
 * so these travel in StaffPilot's own headers.
 */
function forwardToApi(request: NextRequest) {
  const headers = new Headers(request.headers);
  const host = request.headers.get("host") ?? "";
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  headers.set("x-forwarded-host", host);
  headers.set("x-staffpilot-host", host);
  if (ip) headers.set("x-staffpilot-client-ip", ip);
  if (PROXY_SECRET) headers.set("x-staffpilot-proxy", PROXY_SECRET);
  else headers.delete("x-staffpilot-proxy");
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, API_ORIGIN);
  return NextResponse.rewrite(target, { request: { headers } });
}

/**
 * Sends signed-out visitors to the sign-in page before any app page renders. This only
 * checks that a session cookie exists; the API decides on every request whether it is valid
 * and what the person may see (PRD §10.2: UI checks are cosmetic, the backend enforces).
 */
export function proxy(request: NextRequest) {
  if (isApi(request.nextUrl.pathname)) return forwardToApi(request);
  // The root decides for itself: the homepage on the platform's address, the app on a company's.
  if (request.nextUrl.pathname === "/" || request.cookies.has("sessionid")) return NextResponse.next();
  const login = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    // Every API path, file downloads included: forwarded to Django above.
    "/graphql", "/graphql/:path*", "/api/:path*",
    // Every page except sign-in, the public user guide, the privacy policy and terms, the
    // closed-account page, and static files (robots.txt, sitemap.xml, icons).
    "/((?!login|forgot-password|set-password|signup|welcome|guide|closed|privacy|terms|graphql|api/|_next/|favicon\\.ico|.*\\.[a-z0-9]+$).*)",
  ],
};
