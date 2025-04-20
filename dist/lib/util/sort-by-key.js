/**
 * Sort array of objects by keys
 *
 * @param {Array<Record<string, any>>} array - Array of objects to sort
 * @param {string | string[]} keys - Key or array of keys to sort by
 * @returns {Array<Record<string, any>>} Sorted array
 */
export function sortByKey(array, keys) {
    if (!array || array.length === 0 || !keys) {
        return array;
    }
    // Convert string to array of keys
    const sortKeys = typeof keys === 'string' ? [keys] : keys;
    if (sortKeys.length === 0) {
        return array;
    }
    return array.sort((a, b) => {
        let x = '';
        let y = '';
        // Iterate through keys and concatenate values
        for (const key of sortKeys) {
            if (a[key] && b[key]) {
                x = x + a[key].toString().toLowerCase();
                y = y + b[key].toString().toLowerCase();
            }
        }
        if (x < y) {
            return -1;
        }
        else if (x > y) {
            return 1;
        }
        return 0;
    });
}
export default sortByKey;
