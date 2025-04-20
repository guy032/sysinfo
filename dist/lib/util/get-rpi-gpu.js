import fs from 'fs';
import decodePiCpuinfo from './decode-pi-cpuinfo';
// Cache Raspberry Pi CPU info
let _rpi_cpuinfo = null;
/**
 * Get Raspberry Pi GPU information
 *
 * @param {string[]} [cpuinfo] - CPU info from /proc/cpuinfo or cached info
 * @returns {string|boolean} GPU model or false if not a Raspberry Pi
 */
export function getRpiGpu(cpuinfo) {
    if (_rpi_cpuinfo === null && cpuinfo !== undefined) {
        _rpi_cpuinfo = cpuinfo;
    }
    else if (cpuinfo === undefined && _rpi_cpuinfo !== null) {
        cpuinfo = _rpi_cpuinfo;
    }
    else {
        try {
            cpuinfo = fs.readFileSync('/proc/cpuinfo', { encoding: 'utf8' }).toString().split('\n');
            _rpi_cpuinfo = cpuinfo;
        }
        catch {
            return false;
        }
    }
    const rpi = decodePiCpuinfo(cpuinfo);
    if (rpi.type === '4B' || rpi.type === 'CM4' || rpi.type === 'CM4S' || rpi.type === '400') {
        return 'VideoCore VI';
    }
    if (rpi.type === '5' || rpi.type === '500') {
        return 'VideoCore VII';
    }
    return 'VideoCore IV';
}
export default getRpiGpu;
