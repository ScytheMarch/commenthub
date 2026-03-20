import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Allow public routes
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublic) {
    // Redirect logged-in users away from login page to dashboard
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protect everything else
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
