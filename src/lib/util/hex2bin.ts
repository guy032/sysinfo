/**
 * Convert a hexadecimal number to binary string
 *
 * @param {string} hex - Hexadecimal string to convert
 * @returns {string} Binary string
 */
export function hex2bin(hex: string): string {
  return ('00000000' + Number.parseInt(hex, 16).toString(2)).slice(-8);
}

export default hex2bin;
