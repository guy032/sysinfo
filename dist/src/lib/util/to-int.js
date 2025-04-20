"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toInt = toInt;
/**
 * Convert a value to integer safely
 *
 * @param {any} value - Value to convert
 * @returns {number} Integer value, 0 if NaN
 */
function toInt(value) {
    let result = Number.parseInt(value, 10);
    if (Number.isNaN(result)) {
        result = 0;
    }
    return result;
}
exports.default = toInt;
