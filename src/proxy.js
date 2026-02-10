import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
//middleware file
// Export as named "proxy" function for Next.js 16
export async function proxy(req) {
  const secret = process.env.AUTH_SECRET;
  const { nextUrl } = req;

  const token = await getToken({
    req,
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const publicRoutes = ["/","/privacy-policy","/data-deletion"];
  const authRoutes = ["/login", "/register"];
  const protectedRoutes = [
    "/dashboard",
    "/dashboard/qr",
    "/dashboard/add-product",
    "/dashboard/profile",
    "/dashboard/store",
    "/dashboard/consignors",
    "/dashboard/settings",
    "/dashboard/my-products",
    "/dashboard/storelist",
    "/dashboard/stripe-connect",
    "/dashboard/payment-history",
    "/dashboard/items-sold",
    "/dashboard/my-sold-products",
  ];

  const adminRoutes = [
    "/admin",
    "/admin/live-activity",
    "/admin/stores-users",
    "/admin/products",
    "/admin/support",
    "/admin/reports",
  ];

  const isPublic = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isProtected = protectedRoutes.includes(nextUrl.pathname);
  const isAdminRoute = adminRoutes.includes(nextUrl.pathname);

  const userRole = token?.role || null;

  if (isPublic && token) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard/add-product", req.url));
  }
  if (isPublic ){
    return NextResponse.next();
  }
  if (isAuthRoute && token) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    } else if (userRole === "store") {
      return NextResponse.redirect(new URL("/dashboard/add-product", req.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard/storelist", req.url));
    }
  }

  // Admin route protection
  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard/profile", req.url));
  }

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Prevent admin from accessing regular dashboard routes
  if (isProtected && userRole === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Restrict "store" role from accessing "consignors" and "storelist"
  if (
    userRole === "store" &&
    ["/dashboard/consignors", "/dashboard/storelist","/dashboard/my-sold-products", "/dashboard/qr", "/dashboard/my-products"].includes(nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/dashboard/profile", req.url));
  }

  if(userRole === "brand" && 
    ["/dashboard/consignors","/dashboard/add-product","/dashboard/items-sold","/dashboard/invite-store","/dashboard/qr"].includes(nextUrl.pathname)){
    return NextResponse.redirect(new URL("/dashboard/profile", req.url));
  }

  if (
    userRole === "consignor" &&
    ["/dashboard/store", "/dashboard/add-product", "/dashboard/items-sold","/dashboard/ree-collect","/dashboard/invite-store"].includes(nextUrl.pathname)
  ) {
    return NextResponse.redirect(new URL("/dashboard/profile", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};