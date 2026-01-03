/**
 * Layout Design System Constants
 * Standardized spacing, containers, and layout patterns
 * 
 * @description
 * This file defines the layout constants used throughout Inherit.
 * Import these constants to ensure consistent spacing and containers.
 * 
 * Usage:
 * import { LAYOUT } from '@/lib/constants/layout';
 * <div className={LAYOUT.container}>...</div>
 */

/**
 * Main layout classes
 * Use these for consistent layouts across all pages
 */
export const LAYOUT = {
  // ===== CONTAINERS =====
  /** Standard container - Use for most pages */
  container: "max-w-7xl mx-auto",
  
  /** Narrow container - Use for focused content (FAQ, forms) */
  containerNarrow: "max-w-5xl mx-auto",
  
  /** Extra narrow container - Use for single-column content */
  containerXNarrow: "max-w-3xl mx-auto",
  
  // ===== PAGE PADDING =====
  /** Horizontal page padding (responsive) */
  pagePaddingX: "px-4 sm:px-6 lg:px-8",
  
  /** Vertical page padding */
  pagePaddingY: "py-8",
  
  /** Full page padding (most common) */
  pagePadding: "py-8 px-4 sm:px-6 lg:px-8",
  
  /** Reduced vertical padding */
  pagePaddingCompact: "py-6 px-4 sm:px-6 lg:px-8",
  
  // ===== SECTION SPACING =====
  /** Default section margin */
  sectionSpacing: "mb-8",
  
  /** Large section spacing */
  sectionSpacingLarge: "mb-12",
  
  /** Small section spacing */
  sectionSpacingSmall: "mb-6",
  
  // ===== CARD GRIDS =====
  /** 2-column card grid */
  cardGrid2: "grid grid-cols-1 md:grid-cols-2 gap-6",
  
  /** 3-column card grid */
  cardGrid3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  
  /** 4-column card grid (stats) */
  cardGrid4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
  
  // ===== STACK SPACING =====
  /** Tight stack (form fields) */
  stackTight: "space-y-2",
  
  /** Default stack */
  stackDefault: "space-y-4",
  
  /** Loose stack (cards) */
  stackLoose: "space-y-6",
  
  /** Extra loose stack (sections) */
  stackXLoose: "space-y-8",
  
  // ===== FLEX LAYOUTS =====
  /** Center content */
  flexCenter: "flex items-center justify-center",
  
  /** Space between */
  flexBetween: "flex items-center justify-between",
  
  /** Start aligned */
  flexStart: "flex items-center justify-start",
  
  /** Column stack */
  flexCol: "flex flex-col",
  
  // ===== GAP UTILITIES =====
  gapSmall: "gap-2",
  gapDefault: "gap-4",
  gapLarge: "gap-6",
  gapXLarge: "gap-8",
};

/**
 * Background patterns
 * Consistent page and card backgrounds
 */
export const BACKGROUNDS = {
  /** Standard page background */
  page: "min-h-screen bg-gray-50",
  
  /** Gradient page background (Dashboard style) */
  pageGradient: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100",
  
  /** White page background */
  pageWhite: "min-h-screen bg-white",
  
  /** Card background */
  card: "bg-white",
  
  /** Card with hover effect */
  cardHover: "bg-white hover:shadow-md transition-shadow duration-200",
  
  /** Card with border */
  cardBordered: "bg-white border border-gray-200",
  
  /** Muted section background */
  section: "bg-gray-50",
};

/**
 * Border radius patterns
 */
export const RADIUS = {
  none: "rounded-none",
  sm: "rounded-sm",
  default: "rounded-lg",
  lg: "rounded-xl",
  xl: "rounded-2xl",
  full: "rounded-full",
};

/**
 * Shadow patterns
 */
export const SHADOWS = {
  none: "shadow-none",
  sm: "shadow-sm",
  default: "shadow",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

/**
 * Common component combinations
 * Pre-built class combinations for common patterns
 */
export const COMPONENTS = {
  /** Standard page wrapper */
  pageWrapper: "min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8",
  
  /** Page content container */
  pageContent: "max-w-7xl mx-auto",
  
  /** Standard card */
  card: "bg-white rounded-xl shadow-sm p-6",
  
  /** Card with hover */
  cardInteractive: "bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer",
  
  /** Section container */
  sectionContainer: "bg-white rounded-xl shadow-sm p-6 mb-8",
  
  /** Sticky header */
  stickyHeader: "sticky top-20 z-40 bg-white shadow-sm",
};

export default LAYOUT;

