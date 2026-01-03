import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Admin Authentication Middleware
 * 
 * This middleware validates JWT tokens for admin-protected routes.
 * Tokens are verified using the ADMIN_JWT_SECRET environment variable.
 * 
 * Usage:
 * ```js
 * import { adminAuth } from "@/lib/middleware/adminAuth";
 * 
 * export const GET = adminAuth(async (req) => {
 *   // Your protected route logic here
 *   return NextResponse.json({ data: "protected data" });
 * });
 * ```
 * 
 * @requires ADMIN_JWT_SECRET - Secret key for verifying JWT tokens
 */

/**
 * Retrieves the JWT secret as a Uint8Array for jose library
 * @returns {Uint8Array} The encoded JWT secret
 * @throws {Error} If ADMIN_JWT_SECRET is not defined
 */
function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET environment variable is not defined");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Extracts the Bearer token from the Authorization header
 * @param {Request} req - The incoming request object
 * @returns {string|null} The token if found, null otherwise
 */
function extractBearerToken(req) {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader) {
    return null;
  }
  
  // Support both "Bearer <token>" and legacy "Basic <credentials>" format
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7); // Remove "Bearer " prefix
  }
  
  return null;
}

/**
 * Verifies a JWT token and returns the payload
 * @param {string} token - The JWT token to verify
 * @returns {Promise<Object|null>} The decoded payload if valid, null otherwise
 */
async function verifyAdminToken(token) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    
    // Verify the token has admin role
    if (payload.role !== "admin") {
      return null;
    }
    
    return payload;
  } catch (error) {
    // Token is invalid, expired, or tampered with
    console.error("JWT verification failed:", error.message);
    return null;
  }
}

/**
 * Creates an unauthorized response
 * @param {string} message - Error message to include
 * @returns {NextResponse} 401 Unauthorized response
 */
function unauthorizedResponse(message = "Unauthorized") {
  return new NextResponse(
    JSON.stringify({ error: message }),
    { 
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="Admin Access"',
      },
    }
  );
}

/**
 * Higher-order function that wraps API route handlers with admin authentication
 * 
 * @param {Function} handler - The route handler function to protect
 * @returns {Function} A wrapped handler that validates admin authentication
 * 
 * @example
 * // In your API route file:
 * export const GET = adminAuth(async (req) => {
 *   const { adminUser } = req;
 *   return NextResponse.json({ message: `Hello ${adminUser.username}` });
 * });
 */
export function adminAuth(handler) {
  return async (req, ...args) => {
    try {
      // Extract token from Authorization header
      const token = extractBearerToken(req);
      
      if (!token) {
        return unauthorizedResponse("No authorization token provided");
      }
      
      // Verify the JWT token
      const payload = await verifyAdminToken(token);
      
      if (!payload) {
        return unauthorizedResponse("Invalid or expired token");
      }
      
      // Attach admin user info to the request for use in handler
      req.adminUser = {
        username: payload.username,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };
      
      // Call the original handler
      return handler(req, ...args);
      
    } catch (error) {
      console.error("Admin auth middleware error:", error.message);
      return new NextResponse(
        JSON.stringify({ error: "Authentication error" }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

/**
 * Utility function to verify admin token from cookies (for client-side use)
 * This can be used in server components or API routes
 * 
 * @param {string} token - The JWT token from cookies
 * @returns {Promise<{valid: boolean, payload?: Object}>} Verification result
 */
export async function verifyAdminSession(token) {
  if (!token) {
    return { valid: false };
  }
  
  const payload = await verifyAdminToken(token);
  
  if (!payload) {
    return { valid: false };
  }
  
  return { valid: true, payload };
}
