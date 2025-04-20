"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nanoSeconds = nanoSeconds;
/**
 * Get current high-resolution real time in nanoseconds
 *
 * @returns {number} Nanoseconds
 */
function nanoSeconds() {
    const time = process.hrtime();
    if (!Array.isArray(time) || time.length !== 2) {
        return 0;
    }
    return Number(time[0]) * 1e9 + Number(time[1]);
}
exports.default = nanoSeconds;
