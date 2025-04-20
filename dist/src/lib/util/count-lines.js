"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countLines = countLines;
/**
 * Count lines that start with a specific string
 *
 * @param {string[]} lines - Array of lines to check
 * @param {string} [startingWith=''] - String that lines should start with
 * @returns {number} Count of lines
 */
function countLines(lines, startingWith = '') {
    const matchingLines = [];
    for (const line of lines) {
        if (line.startsWith(startingWith)) {
            matchingLines.push(line);
        }
    }
    return matchingLines.length;
}
exports.default = countLines;
