/**
 * Get Raspberry Pi GPU information
 *
 * @param {string[]} [cpuinfo] - CPU info from /proc/cpuinfo or cached info
 * @returns {string|boolean} GPU model or false if not a Raspberry Pi
 */
export declare function getRpiGpu(cpuinfo?: string[]): string | false;
export default getRpiGpu;
//# sourceMappingURL=get-rpi-gpu.d.ts.map