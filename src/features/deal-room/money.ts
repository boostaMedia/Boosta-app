/**
 * Money handling for Deal Room payment requests. Amounts are bigint fils
 * (1 KWD = 1000 fils) end to end — never a JS float — so nothing here can
 * drift from floating-point rounding.
 */

const FILS_PER_KWD = BigInt(1000);
const KWD_INPUT_RE = /^\d+(\.\d{1,3})?$/;

/**
 * Parse a KWD decimal string ("450.500") into fils (450500n). Splits on the
 * decimal point and pads it rather than multiplying a parsed float, so there
 * is no floating-point rounding error.
 */
export function parseKwdToFils(input: string): bigint {
  const trimmed = input.trim();
  if (!KWD_INPUT_RE.test(trimmed)) {
    throw new Error(`Invalid KWD amount: "${input}"`);
  }
  const [whole, fraction = ""] = trimmed.split(".");
  return BigInt(whole) * FILS_PER_KWD + BigInt(fraction.padEnd(3, "0"));
}

/** Format fils (450500n) as a KWD decimal string ("450.500"). */
export function formatFilsToKwd(fils: bigint): string {
  const negative = fils < BigInt(0);
  const abs = negative ? -fils : fils;
  const whole = abs / FILS_PER_KWD;
  const fraction = (abs % FILS_PER_KWD).toString().padStart(3, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

/**
 * Commission fee on a gross amount, truncating (floor) division — fee rounds
 * down, in the provider's favour on the net. Mirrors the DB-side computation
 * in `create_payment_request` exactly, so previews match what gets frozen.
 */
export function computeFeeFils(amountFils: bigint, rateBps: number): bigint {
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10000) {
    throw new Error(`rateBps out of range: ${rateBps}`);
  }
  return (amountFils * BigInt(rateBps)) / BigInt(10000);
}

export function computeNetFils(amountFils: bigint, feeFils: bigint): bigint {
  return amountFils - feeFils;
}
