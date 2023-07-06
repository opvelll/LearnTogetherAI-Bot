/**
 * Converts a Date object to a UNIX timestamp at day level.
 * @param date The date to be converted.
 * @returns The UNIX timestamp at day level.
 */
export function toUnixTimeStampAtDayLevel(date: Date): number {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate.getTime();
}
