"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitByNumber = splitByNumber;
/**
 * Split a string into non-numeric and numeric parts
 *
 * @param {string} str - String to split
 * @returns {[string, string]} Array containing [non-numeric part, numeric part]
 */
function splitByNumber(str) {
    let isNumberStarted = false;
    let num = '';
    let cpart = '';
    for (const c of str) {
        if ((c >= '0' && c <= '9') || isNumberStarted) {
            isNumberStarted = true;
            num += c;
        }
        else {
            cpart += c;
        }
    }
    return [cpart, num];
}
exports.default = splitByNumber;
