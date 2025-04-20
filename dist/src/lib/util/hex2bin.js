"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hex2bin = hex2bin;
/**
 * Convert a hexadecimal number to binary string
 *
 * @param {string} hex - Hexadecimal string to convert
 * @returns {string} Binary string
 */
function hex2bin(hex) {
    return ('00000000' + Number.parseInt(hex, 16).toString(2)).slice(-8);
}
exports.default = hex2bin;
