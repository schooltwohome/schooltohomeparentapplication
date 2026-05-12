// ─── Bus body colours ────────────────────────────────────────────────────────
export const COLOR_BUS_SIDE = "#FFD700";       // bright yellow — left side face
export const COLOR_BUS_TOP = "#FFE566";        // lighter yellow — top/roof face
export const COLOR_BUS_FRONT = "#E8B800";      // darker yellow — front face
export const COLOR_BUS_PIN = "#FFD700";        // pin triangle — same as side

// ─── Window / glass colours ──────────────────────────────────────────────────
export const COLOR_WINDOW_FILL = "#C8E9F5";    // light blue glass fill
export const COLOR_WINDOW_STROKE = "#90CAE8";  // window border
export const COLOR_WINDSHIELD_FILL = "#B8E4F5"; // front windshield

// ─── Detail colours ──────────────────────────────────────────────────────────
export const COLOR_RUBBER_STRIP = "#1A1A1A";   // black rubber strip on side
export const COLOR_BUMPER = "#111111";         // front bumper
export const COLOR_GRILLE = "#444444";         // dark-gray grille lines
export const COLOR_WHEEL_OUTER = "#333333";    // dark tire
export const COLOR_WHEEL_INNER = "#888888";    // lighter hub cap
export const COLOR_WHEEL_BOLT = "#555555";     // hub bolt ring
export const COLOR_SHADOW = "#000000";         // ground shadow

// ─── Status badge colours ────────────────────────────────────────────────────
export const COLOR_BADGE_LIVE = "#22C55E";     // green — GPS active
export const COLOR_BADGE_OFFLINE = "#9CA3AF";  // gray — updating / offline
export const COLOR_BADGE_RING = "#22C55E";     // ring pulse — same green

// ─── SVG canvas dimensions ───────────────────────────────────────────────────
/**
 * viewBox is "-10 -20 120 80" — the negative origin gives headroom for the
 * number badge (above the roof at y=-8) and the isometric top face (y=0..16).
 * Rendered size is slightly smaller so the marker fits comfortably on screen.
 */

/** Total SVG viewBox width in user units. */
export const SVG_WIDTH = 120;
/** Total SVG viewBox height in user units. */
export const SVG_HEIGHT = 80;
/** Rendered pixel width of the SVG element. */
export const SVG_RENDER_W = 150;
/** Rendered pixel height of the SVG element. */
export const SVG_RENDER_H = 100;

// ─── Animation config ────────────────────────────────────────────────────────

/** Spring config for heading rotation (Animated.spring). */
export const ROTATION_SPRING = { tension: 40, friction: 8 } as const;

/** Duration (ms) for coordinate interpolation via AnimatedRegion.timing. */
export const COORD_ANIM_DURATION_MS = 1000;

/** Idle pulse target scale when isLive is false. */
export const IDLE_PULSE_SCALE = 1.08;
/** Half-period (ms) for one beat of the idle pulse (scale up or scale down). */
export const IDLE_PULSE_HALF_MS = 700;

/** Duration (ms) for one full online ring ping expansion. */
export const RING_PULSE_DURATION_MS = 1200;
/** Max scale the ring expands to during the ping. */
export const RING_PULSE_MAX_SCALE = 2.4;

/** Minimum bearing change (degrees) required before triggering a rotation update. */
export const MIN_BEARING_DELTA_DEG = 2;
