import { isBefore, startOfDay, getDay, format } from "date-fns";

/**
 * AVAILABILITY CONFIGURATION
 *
 * Edit this file to control which dates appear as bookable on the calendar.
 */

// ─── Blackout Weekdays ────────────────────────────────────────────────────────
// Days of the week that are NEVER available.
// 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday,
// 5 = Friday, 6 = Saturday
export const BLACKOUT_WEEKDAYS: number[] = [1, 2, 3, 4]; // Block Mon–Thu

// ─── Blackout Specific Dates ──────────────────────────────────────────────────
// Add specific dates that should be blocked regardless of the weekday rule.
// Format: "YYYY-MM-DD"
export const BLACKOUT_DATES: string[] = [
  // "2026-12-25",
  // "2026-01-01",
];

// ─── Advance Notice ───────────────────────────────────────────────────────────
// Minimum number of days in advance a booking must be made.
export const MIN_ADVANCE_DAYS = 3;

// ─── Booking Window ───────────────────────────────────────────────────────────
// How many months ahead can someone book?
export const MAX_MONTHS_AHEAD = 12;

// ─── Core Availability Logic ─────────────────────────────────────────────────

export function isDateAvailable(date: Date): boolean {
  const today = startOfDay(new Date());
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + MIN_ADVANCE_DAYS);

  // Block past dates and dates within advance notice window
  if (isBefore(date, minDate)) return false;

  // Block dates too far in the future
  const maxDate = new Date(today);
  maxDate.setMonth(today.getMonth() + MAX_MONTHS_AHEAD);
  if (date > maxDate) return false;

  // Block blackout weekdays
  const dayOfWeek = getDay(date);
  if (BLACKOUT_WEEKDAYS.includes(dayOfWeek)) return false;

  // Block specific blackout dates
  const dateStr = format(date, "yyyy-MM-dd");
  if (BLACKOUT_DATES.includes(dateStr)) return false;

  return true;
}

export function getAvailabilityLabel(): string {
  const available: string[] = [];
  const days = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"];
  for (let i = 0; i < 7; i++) {
    if (!BLACKOUT_WEEKDAYS.includes(i)) {
      available.push(days[i]);
    }
  }
  return available.join(", ");
}
