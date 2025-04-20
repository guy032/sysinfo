"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeEscapeSequence = decodeEscapeSequence;
/**
 * Decode escape sequences in a string
 *
 * @param {string} str - String to decode
 * @param {number} [base=16] - Numeric base for parsing escape sequences
 * @returns {string} Decoded string
 */
function decodeEscapeSequence(str, base = 16) {
    return str.replaceAll(/\\x([\dA-Fa-f]{2})/g, (_match, p1) => String.fromCodePoint(Number.parseInt(p1, base)));
}
exports.default = decodeEscapeSequence;
