/**
 * Clean string by removing generic OEM placeholders
 *
 * @param {string} str String to clean
 * @returns {string} Cleaned string
 */
function cleanString(str) {
    return str.replaceAll(/To Be Filled By O.E.M./g, '');
}
export default cleanString;
