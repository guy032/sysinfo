"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFunction = isFunction;
/**
 * Check if a value is a function
 *
 * @param {any} functionToCheck - Value to check
 * @returns {boolean} True if the value is a function
 */
function isFunction(functionToCheck) {
    const getType = {};
    return Boolean(functionToCheck) && getType.toString.call(functionToCheck) === '[object Function]';
}
exports.default = isFunction;
