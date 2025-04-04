import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const secret = process.env.AUTH_SECRET;
  const { nextUrl } = req;

  const token = await getToken({
    req,
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const publicRoutes = ["/"];
  const authRoutes = ["/login", "/register"];
  const protectedRoutes = [
    "/dashboard",
    "/dashboard/add-product",
    "/dashboard/profile",
    "/dashboard/store",
    "/dashboard/consignors",
    "/dashboard/settings",
    "/dashboard/storelist",
  ];

  const isPublic = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isProtected = protectedRoutes.includes(nextUrl.pathname);

  const userRole = token?.role || null;

  if (isPublic) {
    return NextResponse.next();
  }

  if (isAuthRoute && token) {
    if (userRole === "store") {
      return NextResponse.redirect(new URL("/dashboard/add-product", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/storelist", req.url));
    }
  }

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Restrict "store" role from accessing "consignors" and "storelist"
  if (
    userRole === "store" &&
    ["/dashboard/consignors", "/dashboard/storelist"].includes(nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/dashboard/profile", req.url));
  }

  if (
    userRole === "consignor" &&
    ["/dashboard/store", "/dashboard/add-product"].includes(nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/dashboard/profile", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
