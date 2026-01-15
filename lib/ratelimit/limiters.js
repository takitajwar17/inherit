/**
 * Pre-configured Rate Limiters
 *
 * Ready-to-use rate limiters for different endpoint types.
 * Import these directly in your route files.
 */

import { createRateLimiter } from "./index.js";

// ============================================
// Time Constants (for readability)
// ============================================
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// ============================================
// Critical Security Limiters
// ============================================

/**
 * Admin Authentication Limiter
 *
 * Very strict limit to prevent brute-force password attacks.
 * 5 attempts per 15 minutes per IP.
 *
 * Use for: /api/admin/auth
 */
export const adminAuthLimiter = createRateLimiter({
  name: "admin-auth",
  requests: 5,
  windowMs: 15 * MINUTE,
});

/**
 * Quest Attempt Limiter
 *
 * Prevents quest farming and abuse.
 * 10 attempts per minute per user.
 *
 * Use for: /api/attempts
 */
export const attemptLimiter = createRateLimiter({
  name: "quest-attempt",
  requests: 10,
  windowMs: MINUTE,
});

/**
 * Quest Submit Limiter
 *
 * Prevents score manipulation through rapid submissions.
 * 12 submissions per minute per user (increased from 5 to allow experimentation).
 *
 * Use for: /api/attempts/[id]/submit
 */
export const submitLimiter = createRateLimiter({
  name: "quest-submit",
  requests: 12,
  windowMs: MINUTE,
});

// ============================================
// AI & External API Limiters
// ============================================

/**
 * YouTube API Limiter
 *
 * Protects YouTube API quota.
 * 30 requests per minute per IP.
 *
 * Use for: /api/video-search
 */
export const youtubeLimiter = createRateLimiter({
  name: "youtube-api",
  requests: 30,
  windowMs: MINUTE,
});

// ============================================
// User Content Limiters
// ============================================

/**
 * Reply Limiter
 *
 * Prevents spam replies to questions.
 * 10 replies per minute per user.
 *
 * Use for: /api/questions/[id]/reply
 */
export const replyLimiter = createRateLimiter({
  name: "question-reply",
  requests: 10,
  windowMs: MINUTE,
});

/**
 * Vote Limiter
 *
 * Prevents vote manipulation.
 * 30 votes per minute per user.
 *
 * Use for: /api/questions/[id]/upvote, /api/questions/[id]/downvote
 */
export const voteLimiter = createRateLimiter({
  name: "vote",
  requests: 30,
  windowMs: MINUTE,
});

// ============================================
// Admin Operation Limiters
// ============================================

/**
 * Admin Quest Operations Limiter
 *
 * Rate limits quest creation/modification.
 * 20 operations per minute per admin.
 *
 * Use for: /api/admin/quests (POST, PUT, DELETE)
 */
export const adminQuestLimiter = createRateLimiter({
  name: "admin-quest",
  requests: 20,
  windowMs: MINUTE,
});

// ============================================
// General Purpose Limiters
// ============================================

/**
 * General API Limiter
 *
 * Standard rate limit for general endpoints.
 * 60 requests per minute per IP.
 *
 * Use for: General read-heavy endpoints
 */
export const generalLimiter = createRateLimiter({
  name: "general",
  requests: 60,
  windowMs: MINUTE,
});

/**
 * Socket/Real-time Limiter
 *
 * For Pusher/WebSocket events.
 * 100 events per minute per user.
 *
 * Use for: /api/socket
 */
export const socketLimiter = createRateLimiter({
  name: "socket",
  requests: 100,
  windowMs: MINUTE,
});

/**
 * AI Operation Limiter
 *
 * Prevents abuse of AI features.
 * 50 requests per minute per user.
 *
 * Use for: /api/ai/chat, /api/ai/process
 */
export const aiLimiter = createRateLimiter({
  name: "ai-operation",
  requests: 50,
  windowMs: MINUTE,
});

// ============================================
// Limiter Summary (for documentation)
// ============================================

/**
 * All configured limiters with their settings
 * Useful for admin dashboards or monitoring
 */
export const limiterConfigs = {
  "admin-auth": {
    requests: 5,
    windowMs: 15 * MINUTE,
    description: "Admin login attempts",
  },
  "quest-attempt": {
    requests: 10,
    windowMs: MINUTE,
    description: "Quest attempt creation",
  },
  "quest-submit": {
    requests: 12,
    windowMs: MINUTE,
    description: "Quest answer submission",
  },

  "youtube-api": {
    requests: 30,
    windowMs: MINUTE,
    description:
      "YouTube searches (user-based if authenticated, IP-based if anonymous)",
  },
  "question-reply": {
    requests: 10,
    windowMs: MINUTE,
    description: "Question replies",
  },
  vote: { requests: 30, windowMs: MINUTE, description: "Upvotes/downvotes" },
  "admin-quest": {
    requests: 20,
    windowMs: MINUTE,
    description: "Admin quest operations",
  },
  general: { requests: 60, windowMs: MINUTE, description: "General API calls" },
  socket: { requests: 100, windowMs: MINUTE, description: "Real-time events" },
};
