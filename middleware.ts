import NextAuth from "next-auth";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  publicRoutes,
  authRoutes,
} from "@/routes";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

// Inner auth handler — only handles routing decisions, no header injection.
// Returning NextResponse.next() (never null) ensures auth cookies are preserved.
const authHandler = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) return NextResponse.next();

  if (isAuthRoute) {
    if (isLoggedIn)
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/auth/sign-in", nextUrl));
  }

  return NextResponse.next();
});

/**
 * Outer middleware — runs AFTER auth so COEP/COOP headers cannot be stripped
 * by NextAuth's internal response wrapping.
 */
export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (authHandler as any)(req, event);

  // Inject COEP/COOP only for the editor page (required for WebContainer SharedArrayBuffer)
  if (req.nextUrl.pathname.startsWith("/editor")) {
    // Skip redirects (e.g. unauthenticated user sent to /auth/sign-in)
    if (res instanceof Response && res.status >= 300 && res.status < 400) {
      return res;
    }
    const response = (res as NextResponse) ?? NextResponse.next();
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    return response;
  }

  return res;
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
