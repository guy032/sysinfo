"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findObjectByKey = findObjectByKey;
/**
 * Find the index of an object in an array by key/value
 *
 * @param {Array<Record<string, any>>} array - Array to search
 * @param {string} key - Key to check
 * @param {any} value - Value to match
 * @returns {number} Index of found object or -1 if not found
 */
function findObjectByKey(array, key, value) {
    for (const [i, element] of array.entries()) {
        if (element[key] === value) {
            return i;
        }
    }
    return -1;
}
exports.default = findObjectByKey;
