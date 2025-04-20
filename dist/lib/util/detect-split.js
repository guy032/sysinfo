/**
 * Detect the split position between a letter prefix and numbers in a string
 * Returns split position index (between letter and numbers)
 *
 * @param {string} str - String to detect split in
 * @returns {number[]} Array [position from start, position from end]
 */
export function detectSplit(str) {
    const result = [0, 0];
    let part = 0;
    // Using spread operator instead of split('')
    for (const element of str) {
        if (element >= '0' && element <= '9') {
            if (part === 1) {
                part++;
            }
            if (part === 0) {
                result[0]++;
            }
            else {
                result[1]++;
            }
        }
        else {
            if (part === 0) {
                result[0]++;
            }
            else {
                result[1]++;
            }
            if (part === 0) {
                part++;
            }
        }
    }
    if (part === 0) {
        result[1] = 0;
    }
    if (result[0] > 0) {
        result[0]--;
    }
    return result;
}
export default detectSplit;
