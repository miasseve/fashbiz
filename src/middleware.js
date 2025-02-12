import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const secret = process.env.AUTH_SECRET;
  const { nextUrl } = req;
  const token = await getToken({
    req,
    secret,
    secureCookie: process.env.NODE_ENV === "production" ? true : false,
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
  ];

  const isPublic = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isProtected = protectedRoutes.includes(nextUrl.pathname);
  if (isPublic) {
    return NextResponse.next();
  }

  if (isAuthRoute && token) {
    console.log(token, "tokentoken");
    return NextResponse.redirect(new URL("/dashboard/add-product", req.url));
  }

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
