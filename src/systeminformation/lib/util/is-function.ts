/**
 * Check if a value is a function
 *
 * @param {any} functionToCheck - Value to check
 * @returns {boolean} True if the value is a function
 */
export function isFunction(functionToCheck: any): boolean {
  const getType = {};

  return Boolean(functionToCheck) && getType.toString.call(functionToCheck) === '[object Function]';
}

export default isFunction;
