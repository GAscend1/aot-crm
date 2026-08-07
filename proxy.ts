import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** File extensions that must be served directly without authentication. */
const STATIC_ASSET_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".ico",
  ".css", ".js", ".mjs", ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".txt", ".pdf", ".json", ".xml", ".map", ".webmanifest",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const publicRoutes = [
    "/", "/features", "/solutions", "/integrations", "/pricing",
    "/security", "/resources", "/contact", "/book-demo", "/login",
    "/auth/error",
  ];

  if (pathname.startsWith("/api")) return;

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/favicon.ico") return;

  // Public static assets (images, fonts, documents) must be served directly
  // and not gated behind authentication.
  const lowerPath = pathname.toLowerCase();
  if (STATIC_ASSET_EXTENSIONS.some((ext) => lowerPath.endsWith(ext))) return;

  const isPublic = publicRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(route + "/");
  });

  if (isPublic) return;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
