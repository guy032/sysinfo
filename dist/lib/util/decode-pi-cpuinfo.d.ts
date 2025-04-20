/**
 * Raspberry Pi revision code lookup result
 */
interface PiInfo {
    model: string;
    serial: string;
    revisionCode: string;
    memory: number;
    manufacturer: string;
    processor: string;
    type: string;
    revision: string;
}
/**
 * Decode Raspberry Pi CPU info
 *
 * @param {string[]} [lines] - CPU info from /proc/cpuinfo or cached info
 * @returns {PiInfo} Decoded Raspberry Pi information
 */
export declare function decodePiCpuinfo(lines?: string[]): PiInfo;
export default decodePiCpuinfo;
//# sourceMappingURL=decode-pi-cpuinfo.d.ts.map