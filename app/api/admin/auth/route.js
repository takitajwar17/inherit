/**
 * Admin Authentication API Route
 * 
 * POST /api/admin/auth
 * 
 * Validates admin credentials against environment variables and returns a JWT token.
 * Password is compared using bcrypt for secure hashing.
 * 
 * @requires ADMIN_USERNAME - Admin username from environment
 * @requires ADMIN_PASSWORD_HASH - Bcrypt-hashed admin password from environment
 * @requires ADMIN_JWT_SECRET - Secret key for signing JWT tokens
 */

import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import logger, { logAuth } from "@/lib/logger";
import { validateRequest, adminLoginSchema } from "@/lib/validation";
import { withRateLimit } from "@/lib/ratelimit/middleware";
import { adminAuthLimiter } from "@/lib/ratelimit/limiters";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId,
  parseJsonBody 
} from "@/lib/errors/apiResponse";
import { 
  ValidationError, 
  AuthenticationError,
  InternalServerError 
} from "@/lib/errors";

/**
 * Retrieves the JWT secret as a Uint8Array for jose library
 * @returns {Uint8Array} The encoded JWT secret
 * @throws {InternalServerError} If ADMIN_JWT_SECRET is not defined
 */
function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new InternalServerError("ADMIN_JWT_SECRET environment variable is not defined");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generates a JWT token for authenticated admin users
 * @param {string} username - The admin username to include in the token
 * @returns {Promise<string>} The signed JWT token
 */
async function generateAdminToken(username) {
  const token = await new SignJWT({ 
    username, 
    role: "admin",
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJwtSecret());
  
  return token;
}

/**
 * Handles POST requests for admin authentication
 * Rate limited: 5 requests per 15 minutes per IP
 * @param {Request} req - The incoming request object
 * @returns {NextResponse} JSON response with success status and token, or error
 */
async function handlePost(req) {
  const requestId = generateRequestId();
  
  try {
    // Parse JSON body with error handling
    const body = await parseJsonBody(req);

    // Validate request body with Zod schema
    const validation = validateRequest(adminLoginSchema, body);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.errors);
    }

    const { username, password } = validation.data;

    // Get admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    // Ensure environment variables are configured
    if (!adminUsername || !adminPasswordHash) {
      logger.error("Admin credentials not configured in environment variables");
      throw new InternalServerError("Server configuration error");
    }

    // Verify username matches
    if (username !== adminUsername) {
      // Use constant-time comparison behavior by still checking password
      // This prevents timing attacks that could reveal valid usernames
      await bcrypt.compare(password, adminPasswordHash);
      logAuth("admin_login", false, { username, reason: "invalid_username" });
      throw new AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);
    
    if (!isPasswordValid) {
      logAuth("admin_login", false, { username, reason: "invalid_password" });
      throw new AuthenticationError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    // Generate JWT token for authenticated admin
    const token = await generateAdminToken(username);
    logAuth("admin_login", true, { username });

    // Return success with token
    return successResponse({ 
      token,
      expiresIn: "24h"
    });

  } catch (error) {
    return errorResponse(error, requestId);
  }
}

// Export with rate limiting wrapper (5 requests per 15 minutes)
export const POST = withRateLimit(adminAuthLimiter, handlePost);
