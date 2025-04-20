/**
 * Get current high-resolution real time in nanoseconds
 *
 * @returns {number} Nanoseconds
 */
export function nanoSeconds() {
    const time = process.hrtime();
    if (!Array.isArray(time) || time.length !== 2) {
        return 0;
    }
    return Number(time[0]) * 1e9 + Number(time[1]);
}
export default nanoSeconds;
