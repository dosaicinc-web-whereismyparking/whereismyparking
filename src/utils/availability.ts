/**
 * Format a listing's `availableHours` JSONB into a human-readable string.
 *
 * Supported shapes (all optional):
 *   { open: "06:00", close: "23:00" }  → "Available 06:00–23:00"
 *   { weekdays: "06:00-23:00" }         → "Available 06:00-23:00"
 *   {} / null / undefined               → "Available 24/7"
 *
 * The returned string always contains the word "Available" so the UI never
 * renders an empty timing slot.
 */
export function formatAvailability(hours: unknown): string {
  if (hours && typeof hours === 'object') {
    const h = hours as Record<string, unknown>;
    if (typeof h.open === 'string' && typeof h.close === 'string') {
      return `Available ${h.open}–${h.close}`;
    }
    if (typeof h.weekdays === 'string' && h.weekdays.length > 0) {
      return `Available ${h.weekdays}`;
    }
  }
  return 'Available 24/7';
}
