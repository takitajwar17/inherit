import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Main Application Middleware
 * 
 * Handles authentication for all routes:
 * - Admin routes: JWT token verification
 * - Other routes: Clerk authentication
 * 
 * @param {Request} request - The incoming request
 * @returns {NextResponse} The middleware response
 */
export default async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  // Allow public quests routes (but not /api/quests/user which requires auth)
  if (pathname.startsWith('/api/quests') && pathname !== '/api/quests/user') {
    return NextResponse.next();
  }
  
  // Check if the request is for admin routes
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/api/admin')) {
    
    const loginPath = "/admin/login";
    const authPath = "/api/admin/auth";

    // Allow access to login page and auth endpoint
    if (request.nextUrl.pathname === loginPath || 
        request.nextUrl.pathname === authPath) {
      return NextResponse.next();
    }

    // Check for admin authentication
    const authHeader = request.headers.get("authorization");
    const adminToken = request.cookies.get("adminToken")?.value;

    // Get token from either Authorization header (Bearer token) or cookie
    let token = null;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (adminToken) {
      token = adminToken;
    }

    // No token found
    if (!token) {
      // If it's an API request, return 401
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: "Unauthorized", message: "No authentication token provided" },
          { 
            status: 401,
            headers: { "WWW-Authenticate": 'Bearer realm="Admin Access"' }
          }
        );
      }
      // Otherwise redirect to login
      return NextResponse.redirect(new URL(loginPath, request.url));
    }

    // Verify JWT token
    try {
      const secret = process.env.ADMIN_JWT_SECRET;
      
      if (!secret) {
        console.error("ADMIN_JWT_SECRET not configured");
        // If it's an API request, return 500
        if (request.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: "Server configuration error" },
            { status: 500 }
          );
        }
        return NextResponse.redirect(new URL(loginPath, request.url));
      }

      // Verify the JWT token using jose (Edge-compatible)
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );

      // Check if token has admin role
      if (payload.role !== "admin") {
        throw new Error("Invalid role");
      }

      // Token is valid, allow the request to proceed
      // Add admin info to headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-admin-username", payload.username);
      requestHeaders.set("x-admin-role", payload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      // Token verification failed (invalid, expired, or tampered)
      console.error("Admin token verification failed:", error.message);
      
      // If it's an API request, return 401
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { 
            status: 401,
            headers: { "WWW-Authenticate": 'Bearer realm="Admin Access"' }
          }
        );
      }
      
      // Redirect to login and clear the invalid token
      const response = NextResponse.redirect(new URL(loginPath, request.url));
      response.cookies.delete("adminToken");
      return response;
    }
  }

  // For non-admin routes, use Clerk authentication
  const clerkMiddleware = authMiddleware({
    publicRoutes: [
      "/", 
      "sign-in", 
      "sign-up", 
      "/api/video-search", 
      "/api/voice-routing"
      // Note: /api/quests routes are handled above, before Clerk middleware
    ],
    ignoredRoutes: ["/api/webhooks(.*)"],
  });

  return clerkMiddleware(request);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
