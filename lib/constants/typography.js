/**
 * Typography Design System Constants
 * Single source of truth for all text styling across the application
 * 
 * @description
 * This file defines the typography scale used throughout Inherit.
 * Import these constants to ensure consistent text styling.
 * 
 * Usage:
 * import { TYPOGRAPHY } from '@/lib/constants/typography';
 * <h1 className={TYPOGRAPHY.pageTitle}>Page Title</h1>
 */

/**
 * Main typography classes
 * Use these for consistent text styling across all pages
 */
export const TYPOGRAPHY = {
  // ===== PAGE LEVEL =====
  /** Page titles - Use on main h1 of each page */
  pageTitle: "text-3xl font-bold text-gray-900",
  
  /** Page subtitles - Brief description under page title */
  pageSubtitle: "text-base text-gray-600 mt-1",
  
  // ===== SECTION LEVEL =====
  /** Section titles - h2 within pages */
  sectionTitle: "text-xl font-semibold text-gray-900",
  
  /** Section subtitles - Description under section titles */
  sectionSubtitle: "text-sm text-gray-500",
  
  // ===== CARD LEVEL =====
  /** Card titles - Main heading within cards */
  cardTitle: "text-lg font-semibold text-gray-900",
  
  /** Card subtitles - Secondary text in card headers */
  cardSubtitle: "text-sm text-gray-600",
  
  /** Card descriptions - Body text within cards */
  cardDescription: "text-sm text-gray-600",
  
  // ===== BODY TEXT =====
  /** Large body text - Important paragraphs */
  bodyLarge: "text-base text-gray-700",
  
  /** Default body text - Standard paragraphs */
  bodyDefault: "text-sm text-gray-600",
  
  /** Small body text - Less important content */
  bodySmall: "text-xs text-gray-500",
  
  // ===== META/UTILITY =====
  /** Meta text - Timestamps, counts, secondary info */
  metaText: "text-sm text-gray-500",
  
  /** Muted text - Tertiary info, hints */
  mutedText: "text-xs text-gray-400",
  
  // ===== LABELS =====
  /** Form labels - Input labels */
  label: "text-sm font-medium text-gray-700",
  
  /** Small labels - Secondary labels, badges */
  labelSmall: "text-xs font-medium text-gray-500",
  
  // ===== SPECIAL =====
  /** Empty state title */
  emptyStateTitle: "text-lg font-medium text-gray-900",
  
  /** Empty state description */
  emptyStateDescription: "text-sm text-gray-500",
  
  /** Error text */
  errorText: "text-sm text-red-600",
  
  /** Success text */
  successText: "text-sm text-green-600",
};

/**
 * Font weight reference
 * For documentation and consistency
 */
export const FONT_WEIGHTS = {
  bold: "font-bold",         // 700 - Page titles only
  semibold: "font-semibold", // 600 - Section & card titles
  medium: "font-medium",     // 500 - Labels, emphasized text
  normal: "font-normal",     // 400 - Body text (default)
  light: "font-light",       // 300 - Rarely used
};

/**
 * Text color reference
 * IMPORTANT: Use GRAY system only, NOT slate
 */
export const TEXT_COLORS = {
  primary: "text-gray-900",   // Headings, important text
  secondary: "text-gray-700", // Body text
  tertiary: "text-gray-600",  // Descriptions, card text
  muted: "text-gray-500",     // Secondary info, meta
  subtle: "text-gray-400",    // Timestamps, hints
  disabled: "text-gray-300",  // Disabled states
};

/**
 * Text size reference (Tailwind defaults)
 * For documentation purposes
 */
export const TEXT_SIZES = {
  xs: "text-xs",     // 12px
  sm: "text-sm",     // 14px
  base: "text-base", // 16px
  lg: "text-lg",     // 18px
  xl: "text-xl",     // 20px
  "2xl": "text-2xl", // 24px
  "3xl": "text-3xl", // 30px
  "4xl": "text-4xl", // 36px - AVOID for page titles
};

export default TYPOGRAPHY;

