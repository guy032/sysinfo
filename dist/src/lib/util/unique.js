"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unique = unique;
/**
 * Create a unique array of objects based on the object properties
 *
 * @param {Array<Record<string, any>>} obj - Array of objects
 * @returns {Array<Record<string, any>>} Array with unique objects
 */
function unique(obj) {
    const uniques = [];
    const stringify = {};
    for (const element of obj) {
        const keys = Object.keys(element);
        keys.sort((a, b) => a.localeCompare(b));
        let str = '';
        for (const key of keys) {
            str += JSON.stringify(key);
            str += JSON.stringify(element[key]);
        }
        if (!stringify[str]) {
            uniques.push(element);
            stringify[str] = true;
        }
    }
    return uniques;
}
exports.default = unique;
