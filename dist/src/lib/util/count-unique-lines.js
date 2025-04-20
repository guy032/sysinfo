"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countUniqueLines = countUniqueLines;
/**
 * Count unique lines that start with a specific string
 *
 * @param {string[]} lines - Array of lines to check
 * @param {string} [startingWith=''] - String that lines should start with
 * @returns {number} Count of unique lines
 */
function countUniqueLines(lines, startingWith = '') {
    const uniqueLines = [];
    for (const line of lines) {
        if (line.startsWith(startingWith) && !uniqueLines.includes(line)) {
            uniqueLines.push(line);
        }
    }
    return uniqueLines.length;
}
exports.default = countUniqueLines;
