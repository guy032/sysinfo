/**
 * Convert a value to integer safely
 *
 * @param {any} value - Value to convert
 * @returns {number} Integer value, 0 if NaN
 */
export function toInt(value: any): number {
  let result = Number.parseInt(value, 10);

  if (Number.isNaN(result)) {
    result = 0;
  }

  return result;
}

export default toInt;
