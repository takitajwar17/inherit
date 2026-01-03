import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

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
    .setExpirationTime("24h") // Token expires in 24 hours
    .sign(getJwtSecret());
  
  return token;
}

/**
 * Handles POST requests for admin authentication
 * @param {Request} req - The incoming request object
 * @returns {NextResponse} JSON response with success status and token, or error
 */
export async function POST(req) {
  try {
    const { username, password } = await req.json();

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Get admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    // Ensure environment variables are configured
    if (!adminUsername || !adminPasswordHash) {
      console.error("Admin credentials not configured in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify username matches
    if (username !== adminUsername) {
      // Use constant-time comparison behavior by still checking password
      // This prevents timing attacks that could reveal valid usernames
      await bcrypt.compare(password, adminPasswordHash);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token for authenticated admin
    const token = await generateAdminToken(username);

    // Return success with token
    return NextResponse.json({ 
      success: true,
      token,
      expiresIn: "24h"
    });

  } catch (error) {
    console.error("Admin auth error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
