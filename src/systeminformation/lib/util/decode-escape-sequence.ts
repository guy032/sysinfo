/**
 * Decode escape sequences in a string
 *
 * @param {string} str - String to decode
 * @param {number} [base=16] - Numeric base for parsing escape sequences
 * @returns {string} Decoded string
 */
export function decodeEscapeSequence(str: string, base = 16): string {
  return str.replaceAll(/\\x([\dA-Fa-f]{2})/g, (_match, p1: string) =>
    String.fromCodePoint(Number.parseInt(p1, base)),
  );
}

export default decodeEscapeSequence;
