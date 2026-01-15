/**
 * Media/Voice/Video Validation Schemas
 *
 * Schemas for voice commands and video search.
 */

import { z } from "zod";
import { sanitizedString } from "./common.js";

/**
 * Video search validation
 * POST /api/video-search
 */
export const videoSearchSchema = z.object({
  topic: sanitizedString(1, 100),
});

/**
 * Video ID validation (YouTube format)
 */
export const videoIdSchema = z
  .string()
  .min(1, "Video ID is required")
  .max(20, "Video ID too long")
  .refine((str) => /^[a-zA-Z0-9_-]+$/.test(str), {
    message: "Invalid video ID format",
  });
