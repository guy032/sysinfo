/**
 * Find the index of an object in an array by key/value
 *
 * @param {Array<Record<string, any>>} array - Array to search
 * @param {string} key - Key to check
 * @param {any} value - Value to match
 * @returns {number} Index of found object or -1 if not found
 */
export function findObjectByKey(
  array: Array<Record<string, any>>,
  key: string,
  value: any,
): number {
  for (const [i, element] of array.entries()) {
    if (element[key] === value) {
      return i;
    }
  }

  return -1;
}

export default findObjectByKey;
