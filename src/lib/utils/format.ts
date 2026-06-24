/**
 * Smart Parsing & Formatting for physical metrics
 */

/**
 * Parses a string input (like "4:22.96" or "4'22.96" or "262.96") into total seconds as a float.
 * @param input Raw string from user input
 * @returns Parsed number in seconds. If parsing fails or is invalid, returns NaN.
 */
export function parseTimeStringToSeconds(input: string): number {
  if (!input) return NaN;

  const trimmed = input.trim();

  // Check if it's in a mm:ss or mm'ss format (allow : or ' for minute separator, and . or " for seconds separator)
  // e.g., "4:22.96", "4'22"96", "4:22"
  const timeMatch = trimmed.match(/^(\d+)[:'](\d{1,2})(?:[\."](\d+))?$/);

  if (timeMatch) {
    const minutes = parseInt(timeMatch[1], 10);
    const seconds = parseInt(timeMatch[2], 10);
    // for milliseconds part, we must handle the raw string since "96" -> 0.96, "05" -> 0.05
    let fraction = 0;
    if (timeMatch[3]) {
      // pad or slice to make it a fraction (e.g., "9" -> 0.9, "96" -> 0.96)
      const fractionStr = timeMatch[3];
      fraction = parseFloat(`0.${fractionStr}`);
    }

    return minutes * 60 + seconds + fraction;
  }

  // Fallback to pure numeric parsing
  const num = parseFloat(trimmed);
  return num;
}

/**
 * Formats a raw seconds float (e.g. 262.96) into a "mm:ss.xx" display string.
 * @param value numeric value in seconds
 */
export function formatSecondsToTime(value: number): string {
  if (isNaN(value)) return String(value);

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  // Get decimal part up to 2 places
  const fraction = Math.round((value - totalSeconds) * 100);

  const mm = minutes.toString();
  const ss = seconds.toString().padStart(2, '0');
  
  if (fraction > 0) {
    const xx = fraction.toString().padStart(2, '0');
    return `${mm}:${ss}.${xx}`;
  }

  return `${mm}:${ss}`;
}

/**
 * Globally handles the display format for ANY metric.
 * Automatically wraps long-distance runs (s) into "mm:ss.xx".
 * @param value Raw DB value (can be number or stringified number)
 * @param unit The unit of the metric ('s', 'cm', '次', etc.)
 * @returns A formatted string
 */
export function displayMetricValue(value: string | number, unit: string): string {
  if (value === null || value === undefined) return '-';

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return String(value);

  // If the unit is seconds and the value is large enough (e.g. >= 60 seconds), format it as mm:ss.xx
  // Wait, if someone ran a 10x5 shuttle run in 14.33s, we DON'T format it as 0:14.33 because it's awkward, just keep 14.33.
  // We'll apply the mm:ss formatting ONLY if value >= 60.
  if (unit === 's' && numericValue >= 60) {
    return formatSecondsToTime(numericValue);
  }

  // Otherwise, just display the raw numeric value
  return numericValue.toString();
}
