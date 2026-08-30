// Nigerian phone number validation + normalization.
// Termii requires international digits-only format WITHOUT a "+": 234XXXXXXXXXX.

/**
 * Normalize any Nigerian number ("0801 234 5678", "+234801...", "234801...")
 * to "2348012345678". Returns null when the number cannot be a valid
 * Nigerian mobile line.
 */
export function normalizeNgPhone(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");

  let national: string;
  if (digits.startsWith("234")) {
    national = digits.slice(3);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  } else {
    return null;
  }

  // Nigerian mobile numbers: 10 digits after country code, starting 70/80/81/90/91...
  if (national.length !== 10) return null;
  if (!/^[789]\d{9}$/.test(national)) return null;

  return "234" + national;
}

/** Human-friendly validation message, or null when valid. */
export function ngPhoneError(raw: string): string | null {
  if (!raw || !raw.trim()) return "No phone number";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return "Number is too short";
  if (digits.length > 13) return "Number is too long";
  if (!normalizeNgPhone(raw)) return "Not a valid Nigerian number (expected 080... or +234...)";
  return null;
}

/** Pretty display format: 2348012345678 → +234 801 234 5678 */
export function formatNgPhone(normalized: string): string {
  const n = normalized.replace(/^234/, "");
  if (n.length !== 10) return normalized;
  return `+234 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}
